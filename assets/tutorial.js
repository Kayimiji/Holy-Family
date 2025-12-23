/* Lightweight Guided Tour component */
class Tour {
  constructor(steps = []){
    this.steps = steps;
    this.index = 0;
    this._createDOM();
    this._bindKeys();
  }
  _createDOM(){
    // overlay
    this.overlay = document.createElement('div');this.overlay.className='tour-overlay';document.body.appendChild(this.overlay);
    // spotlight
    this.spot = document.createElement('div');this.spot.className='tour-spotlight';document.body.appendChild(this.spot);
    // tooltip
    this.tooltip = document.createElement('div');this.tooltip.className='tour-tooltip';this.tooltip.innerHTML=`<h3></h3><p></p><div class="tour-controls"><span class="tour-step-indicator"></span><button class="prev">Back</button><button class="next primary">Next</button><button class="end">End</button></div>`;document.body.appendChild(this.tooltip);
    // controls
    this.tooltip.querySelector('.prev').addEventListener('click',()=>this.prev());
    this.tooltip.querySelector('.next').addEventListener('click',()=>this.next());
    this.tooltip.querySelector('.end').addEventListener('click',()=>this.end());
  }
  start(){
    if(!this.steps||!this.steps.length) return console.warn('Tour: no steps');
    this.overlay.classList.add('show');this.tooltip.classList.add('show');this.showStep(0);
    document.body.classList.add('tour-open');
  }
  showStep(i){
    if(i<0||i>=this.steps.length){return}
    this.index=i;const step=this.steps[i];
    // update text
    this.tooltip.querySelector('h3').textContent=step.title||'';
    this.tooltip.querySelector('p').textContent=step.content||'';
    this.tooltip.querySelector('.tour-step-indicator').textContent=`Step ${i+1} / ${this.steps.length}`;
    // find element
    const el = step.selector?document.querySelector(step.selector):null;
    if(el){
      const r = el.getBoundingClientRect();
      // position spotlight
      const padding = step.padding||8;
      this.spot.style.width = (r.width+padding*2)+'px';
      this.spot.style.height = (r.height+padding*2)+'px';
      this.spot.style.left = (window.scrollX + r.left - padding)+'px';
      this.spot.style.top = (window.scrollY + r.top - padding)+'px';
      this.spot.style.borderRadius = (step.rounded?step.rounded:'8px');
      // show pulsate if requested
      if(step.pulse) this.spot.classList.add('tour-pulse'); else this.spot.classList.remove('tour-pulse');
      // position tooltip (prefer bottom)
      const tt = this.tooltip.getBoundingClientRect();
      let top = window.scrollY + r.bottom + 12;
      let left = window.scrollX + r.left;
      // if tooltip overflows to right, clamp
      if(left + 380 > window.innerWidth) left = window.innerWidth - 400;
      // if not enough space at bottom, place on top
      if(top + tt.height > window.scrollY + window.innerHeight){ top = window.scrollY + r.top - tt.height - 12; }
      this.tooltip.style.left = left+'px';
      this.tooltip.style.top = top+'px';
      // ensure visible
      const bufferTop = r.top - 80; if(bufferTop<0) window.scrollTo({top:0,behavior:'smooth'}); else window.scrollTo({top: window.scrollY + r.top - 80,behavior:'smooth'});
    } else {
      // If no element found, center tooltip
      this.spot.style.width = '0px';this.spot.style.height='0px';this.spot.style.left = '-9999px';this.spot.style.top='-9999px';
      const left = Math.max(20,(window.innerWidth - 360)/2);
      const top = Math.max(20,(window.innerHeight - 160)/2)+window.scrollY;
      this.tooltip.style.left = left + 'px';this.tooltip.style.top = top + 'px';
    }
    // update buttons
    this.tooltip.querySelector('.prev').disabled = (i===0);
    this.tooltip.querySelector('.next').textContent = (i===this.steps.length-1)?'Finish':'Next';
  }
  next(){
    if(this.index < this.steps.length-1) this.showStep(this.index+1);
    else this.end();
  }
  prev(){ this.showStep(Math.max(0,this.index-1)); }
  end(){
    this.overlay.classList.remove('show');this.tooltip.classList.remove('show');this.spot.style.left='-9999px';document.body.classList.remove('tour-open');
  }
  _bindKeys(){
    document.addEventListener('keydown', (e)=>{
      if(!document.body.classList.contains('tour-open')) return;
      if(e.key === 'Escape') this.end();
      if(e.key === 'ArrowRight') this.next();
      if(e.key === 'ArrowLeft') this.prev();
    });
  }
}

// Default steps (gracefully skip missing selectors)
const defaultSteps = [
  {selector:'nav', title:'Navigation', content:'Use the navigation or sidebar to move through the system.'},
  {selector:'.records-bookmark', title:'My Records', content:'Quick access to your records and files.'},
  {selector:'#bookNowModal', title:'Bookings', content:'Open the booking modal to schedule appointments.'},
  {selector:'#mainContent', title:'Dashboard', content:'Your main dashboard and stats appear here.'}
];

// expose startTour
window.startTour = (steps)=>{ const tour = new Tour(steps||defaultSteps); tour.start(); return tour };

// attach launch button behavior
window.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('tutorialLaunchBtn');
  if(btn){ btn.addEventListener('click', ()=>{ window.startTour(); }); }
});

// small helper to autoplay demo in tutorial.html if present
window.playTutorialDemo = function(node){
  if(!node) return;
  const demoSteps = node.querySelectorAll('.demo-step');
  let i=0; demoSteps.forEach(d=>d.classList.remove('fade-in'));
  function step(){ if(i>=demoSteps.length) return; demoSteps[i].classList.add('fade-in'); i++; setTimeout(step,500); }
  step();
}