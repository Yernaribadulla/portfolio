import { Component, createRef, type HTMLAttributes } from 'react';
import gsap from 'gsap';
type Props=HTMLAttributes<HTMLElement>&{maximized:boolean;exiting?:boolean;onExited:()=>void};
// Snapshot is taken before React changes the maximized class and the layout.
export default class WindowFrame extends Component<Props> {
  node=createRef<HTMLElement>();
  tween:gsap.core.Tween|null=null;
  duration(seconds:number){return matchMedia('(prefers-reduced-motion: reduce)').matches?0:seconds;}
  componentDidMount(){
    this.tween=gsap.fromTo(this.node.current,{y:16,scale:.985,opacity:0},{y:0,scale:1,opacity:1,duration:this.duration(.65),ease:'power2.inOut',clearProps:'transform,opacity'});
  }
  getSnapshotBeforeUpdate(previous:Props){
    return previous.maximized!==this.props.maximized?this.node.current!.getBoundingClientRect():null;
  }
  componentDidUpdate(previous:Props,_state:unknown,snapshot:DOMRect|null){
    const element=this.node.current!;
    if(previous.exiting!==this.props.exiting){
      this.tween?.kill();
      if(this.props.exiting){
        this.tween=gsap.to(element,{opacity:0,y:8,scale:.98,duration:this.duration(.35),ease:'power2.inOut',onComplete:()=>this.props.onExited()});
      }else{
        this.tween=gsap.to(element,{opacity:1,y:0,scale:1,duration:this.duration(.25),clearProps:'transform,opacity'});
      }
    }else if(snapshot){
      this.tween?.kill();
      gsap.set(element,{clearProps:'transform,opacity'});
      const target=element.getBoundingClientRect();
      this.tween=gsap.fromTo(element,{
        x:snapshot.left-target.left,y:snapshot.top-target.top,
        scaleX:snapshot.width/target.width,scaleY:snapshot.height/target.height,
      },{x:0,y:0,scaleX:1,scaleY:1,duration:this.duration(.8),ease:'power3.inOut',clearProps:'transform,opacity'});
    }
  }
  componentWillUnmount(){this.tween?.kill();}
  render(){
    const {maximized,exiting,onExited,children,...props}=this.props;
    return <section {...props} ref={this.node} data-exiting={exiting||undefined} style={{...props.style,transformOrigin:'top left',pointerEvents:exiting?'none':undefined}}>{children}</section>;
  }
}
