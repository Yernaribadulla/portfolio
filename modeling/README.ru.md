# Модель ноутбука

- `yernar-laptop.blend` — редактируемая Blender-модель со студийной камерой и освещением.
- `build_laptop.py` — создание геометрии, материалов, экспорт GLB и рендер Cycles.
- `laptop-preview.png` — рендер модели. Интерфейс экрана добавляется отдельно на сайте.
- `../public/models/laptop.glb` — модель для Three.js, без студийной камеры и светильников.

Повторная генерация в PowerShell:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' --background --python modeling/build_laptop.py
```

Команда перезапишет сгенерированные модель, GLB и рендер. Перед ручным редактированием сохраните отдельную копию `.blend`.
