import test from 'node:test';
import assert from 'node:assert/strict';

// CPU validation of the spatial Schwarzschild null-geodesic model used by
// src/scene/shaders.ts. No rendering, third-party dependencies, or pixel fixtures.
// Keep shaderStep() aligned with the GLSL step selection when it changes.
const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const scale = (v, factor) => v.map((value) => value * factor);
const add = (a, b) => a.map((value, i) => value + b[i]);
const length = (v) => Math.sqrt(dot(v, v));
const normalize = (v) => scale(v, 1 / length(v));
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const angle = (a, b) => Math.acos(clamp(dot(normalize(a), normalize(b)), -1, 1));

function acceleration(position, angularMomentumSquared, rs) {
  const radiusSquared = dot(position, position);
  return scale(position, -1.5 * rs * angularMomentumSquared
    / (radiusSquared * radiusSquared * Math.sqrt(radiusSquared)));
}

function invariant(position, velocity, angularMomentumSquared, rs) {
  return dot(velocity, velocity)
    - rs * angularMomentumSquared / length(position) ** 3;
}

function initialRay({ rs = 1, impact = 3, distance = 24, inclination = 0.3 } = {}) {
  const radial = [0, Math.sin(inclination), Math.cos(inclination)];
  const position = scale(radial, distance * rs);
  const f = 1 - rs / length(position);
  // b = L/E = r sin(localAngle) / sqrt(f). Using a flat-space direction here
  // would shift the critical capture threshold for a finite-distance camera.
  const sine = impact * rs * Math.sqrt(f) / length(position);
  assert.ok(sine < 1, 'Impact parameter must fit the camera distance');
  const localDirection = add(scale(radial, -Math.sqrt(1 - sine * sine)), [sine, 0, 0]);
  const radialComponent = dot(localDirection, radial);
  const velocity = add(localDirection, scale(radial, (Math.sqrt(f) - 1) * radialComponent));
  const angular = cross(position, velocity);
  return { position, velocity, l2: dot(angular, angular), energySquared: f };
}

function shaderStep(position, velocity, rs, quality) {
  const radius = length(position);
  let stepSize = clamp((radius - rs) * 0.17, 0.045 * rs, 2.8) / quality;
  const diskRadius = Math.hypot(position[0], position[2]);
  const planeDistance = Math.abs(position[1]) / (Math.abs(velocity[1]) + 0.02);
  if (diskRadius < rs * 10 && diskRadius > rs * 2.2) {
    stepSize = Math.min(stepSize, Math.max(0.07 * rs, planeDistance * 0.7));
  }
  return stepSize;
}

function trace({
  rs = 1, impact = 3, distance = 24, inclination = 0.3, steps = 112, reference = false,
} = {}) {
  const initial = initialRay({ rs, impact, distance, inclination });
  let position = initial.position;
  let velocity = initial.velocity;
  const initialRadius = length(position);
  let maxRelativeEnergyError = 0;
  let maxRelativeAngularError = 0;
  const limit = reference ? 40000 : Math.min(steps, 176);
  for (let iteration = 0; iteration < limit; iteration++) {
    const radius = length(position);
    if (radius < rs * 1.015) {
      return { outcome: 'captured', velocity, iteration, maxRelativeEnergyError, maxRelativeAngularError };
    }
    if (radius > Math.max(30, initialRadius + 2) && dot(position, velocity) > 0) {
      return {
        outcome: 'escaped', velocity, iteration, maxRelativeEnergyError, maxRelativeAngularError,
        deflection: angle(initial.velocity, velocity),
      };
    }
    // The reference uses the same acceleration and Verlet update with a much
    // smaller step, independent of the shader's finite frame budget.
    const h = reference ? 0.006 * rs : shaderStep(position, velocity, rs, steps / 112);
    const a = acceleration(position, initial.l2, rs);
    const nextPosition = add(add(position, scale(velocity, h)), scale(a, 0.5 * h * h));
    const nextA = acceleration(nextPosition, initial.l2, rs);
    const nextVelocity = add(velocity, scale(add(a, nextA), 0.5 * h));
    position = nextPosition;
    velocity = nextVelocity;
    assert.ok([...position, ...velocity].every(Number.isFinite), 'Ray integration must remain finite');
    maxRelativeEnergyError = Math.max(maxRelativeEnergyError,
      Math.abs(invariant(position, velocity, initial.l2, rs) / initial.energySquared - 1));
    const angular = cross(position, velocity);
    maxRelativeAngularError = Math.max(maxRelativeAngularError,
      Math.abs(dot(angular, angular) / initial.l2 - 1));
  }
  return { outcome: 'exhausted', velocity, iteration: limit, maxRelativeEnergyError, maxRelativeAngularError };
}

test('local camera initialization preserves the requested impact parameter and null-ray invariant', () => {
  for (const rs of [0.65, 1, 1.65]) {
    for (const impact of [2.55, 2.65, 8]) {
      const ray = initialRay({ rs, impact });
      assert.ok(Math.abs(Math.sqrt(ray.l2 / ray.energySquared) / rs - impact) < 1e-12);
      assert.ok(Math.abs(invariant(ray.position, ray.velocity, ray.l2, rs) - ray.energySquared) < 1e-12);
    }
  }
});

test('fine-step reference resolves capture and escape on opposite sides of the critical impact parameter', () => {
  // The analytic distant-observer threshold is b/rs = 3 sqrt(3)/2 ≈ 2.598076.
  assert.equal(trace({ impact: 2.55, reference: true }).outcome, 'captured');
  assert.equal(trace({ impact: 2.65, reference: true }).outcome, 'escaped');
});

test('all shader quality budgets resolve near-critical capture and escape', (context) => {
  for (const steps of [80, 112, 164]) {
    for (const [impact, expected] of [[2.55, 'captured'], [2.65, 'escaped']]) {
      const result = trace({ impact, steps });
      context.diagnostic(`${steps} steps, b/rs=${impact}: ${result.outcome} after ${result.iteration}`);
      assert.equal(result.outcome, expected, `${steps} steps at b/rs=${impact}`);
    }
  }
});

test('weak-field bending decreases with impact parameter and approaches the leading-order trend', () => {
  const impacts = [5, 8, 12];
  const deflections = impacts.map((impact) => {
    const result = trace({ impact, distance: 40, reference: true });
    assert.equal(result.outcome, 'escaped');
    return result.deflection;
  });
  assert.ok(deflections[0] > deflections[1] && deflections[1] > deflections[2]);
  // Finite camera/escape radii omit the asymptotic tails, while higher-order
  // strong-field terms increase bending. This tests scale, not exact equality.
  for (let i = 0; i < impacts.length; i++) {
    const leadingOrder = 2 / impacts[i];
    assert.ok(deflections[i] / leadingOrder > 0.65 && deflections[i] / leadingOrder < 2,
      `b/rs=${impacts[i]} gives a physically plausible weak-field bending scale`);
  }
});

test('mass scaling preserves capture classification and outgoing direction', (context) => {
  for (const impact of [2.55, 2.65, 5]) {
    const baseline = trace({ rs: 1, impact, steps: 164 });
    for (const rs of [0.65, 1.65]) {
      const result = trace({ rs, impact, steps: 164 });
      assert.equal(result.outcome, baseline.outcome, `Mass scale ${rs}, b/rs=${impact}`);
      if (baseline.outcome === 'escaped') {
        const difference = angle(result.velocity, baseline.velocity);
        context.diagnostic(`Mass scale ${rs}, b/rs=${impact}: direction difference ${difference.toFixed(5)} rad`);
        // The production far boundary and maximum step are in world units.
        // Small tail/integration differences are expected, but no visible warp.
        assert.ok(difference < 0.04, `Mass scale ${rs} changes the dimensionless ray by ${difference} rad`);
      }
    }
  }
});

test('80/112/164-step integration converges toward a fine-step escaped ray', (context) => {
  const reference = trace({ impact: 3.2, reference: true });
  assert.equal(reference.outcome, 'escaped');
  const errors = [];
  for (const steps of [80, 112, 164]) {
    const result = trace({ impact: 3.2, steps });
    assert.equal(result.outcome, 'escaped', `${steps}-step ray must finish`);
    const error = angle(result.velocity, reference.velocity);
    errors.push(error);
    context.diagnostic(`${steps} steps: angle error ${error.toFixed(6)} rad; energy error ${result.maxRelativeEnergyError.toExponential(3)}`);
    assert.ok(error < 0.04, `Outgoing direction error exceeds 0.04 rad at ${steps} steps`);
    assert.ok(result.maxRelativeEnergyError < 0.08, 'Energy drift must stay bounded');
    assert.ok(result.maxRelativeAngularError < 1e-10, 'Central-force Verlet must conserve angular momentum');
  }
  assert.ok(errors[2] < errors[0], 'CINEMATIC should improve on LOW angular accuracy');
});

test('critical-band probes distinguish an exhausted ray budget from physical escape', (context) => {
  // Rays arbitrarily close to the separatrix can orbit for arbitrarily long.
  // A fixed shader budget cannot guarantee convergence. Record this explicitly:
  // the renderer must choose a visual fallback for "exhausted", not mistake it
  // for a proven escaped trajectory. This test does not validate that fallback.
  let exhausted = 0;
  for (const impact of [2.595, 2.597, 2.598, 2.599, 2.601]) {
    const reference = trace({ impact, reference: true });
    assert.notEqual(reference.outcome, 'exhausted', 'Fine-step reference must finish this bounded probe');
    for (const steps of [80, 112, 164]) {
      const result = trace({ impact, steps });
      if (result.outcome === 'exhausted') {
        exhausted++;
        context.diagnostic(`UNRESOLVED: ${steps} steps, b/rs=${impact}; reference ${reference.outcome}`);
      } else {
        assert.equal(result.outcome, reference.outcome,
          `${steps} steps at b/rs=${impact} must not confidently return the wrong fate`);
      }
      assert.ok(result.maxRelativeEnergyError < 0.08);
      assert.ok(result.maxRelativeAngularError < 1e-10);
    }
  }
  context.diagnostic(`${exhausted}/15 critical-band probes need the renderer's explicit budget-exhaustion fallback`);
});
