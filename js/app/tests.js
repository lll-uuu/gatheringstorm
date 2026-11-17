export function runSmokeTests({ renderer, camera, hotspots }) {
  const testsEl = document.getElementById('tests');
  const tests = [];
  function assert(name, fn){
    try { fn(); tests.push({name, pass:true}); }
    catch(e){ console.error('[Test Failed]', name, e); tests.push({name, pass:false}); }
  }
  function renderTests(){
    if (!testsEl) return;
    const pass = tests.filter(t=>t.pass).length;
    testsEl.textContent = `Tests: ${pass}/${tests.length}`;
  }

  assert('THREE present', ()=>{ if(!window.THREE) throw 0; });
  assert('Renderer mounted', ()=>{ if(!renderer.domElement || !renderer.domElement.parentElement) throw 0; });
  assert('Hotspots exist', ()=>{ if(!hotspots.length) throw 0; });
  assert('Sprites project on screen', ()=>{ const v = hotspots[0].position.clone().project(camera); if(Math.abs(v.x)>1 || Math.abs(v.y)>1) throw 0; });

  renderTests();
}
