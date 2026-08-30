(() => {
  const $ = sel => document.querySelector(sel)
  const $all = sel => Array.from(document.querySelectorAll(sel))

  const timersEl = $('#timers')
  const addBtn = $('#add-timer')
  const nameInput = $('#timer-name')
  const minInput = $('#timer-min')
  const secInput = $('#timer-sec')

  let timers = []
  let uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6)

  function formatTime(s){
    s = Math.max(0, Math.round(s))
    const m = Math.floor(s/60)
    const sec = s%60
    return `${m}:${String(sec).padStart(2,'0')}`
  }

  function createTimer(name, seconds){
    const id = uid()
    const t = {id,name,initial:seconds,remaining:seconds,running:false,interval:null,lastTick:0}
    timers.push(t)
    render()
  }

  function startTimer(t){
    if(t.running) return
    t.running = true
    t.lastTick = performance.now()
    t.interval = setInterval(()=>{
      const now = performance.now()
      const delta = (now - t.lastTick)/1000
      t.lastTick = now
      t.remaining -= delta
      if(t.remaining <= 0){
        t.remaining = 0
        stopTimer(t)
        markDone(t)
      }
      updateTimerEl(t)
    },200)
    updateTimerEl(t)
  }

  function stopTimer(t){
    if(t.interval) {clearInterval(t.interval); t.interval = null}
    t.running = false
    updateTimerEl(t)
  }

  function resetTimer(t){
    stopTimer(t)
    t.remaining = t.initial
    updateTimerEl(t)
  }

  function removeTimer(id){
    const idx = timers.findIndex(x=>x.id===id)
    if(idx>-1){
      const t = timers[idx]
      stopTimer(t)
      timers.splice(idx,1)
      render()
    }
  }

  function markDone(t){
    playBeep()
    updateTimerEl(t)
  }

  function playBeep(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type='sine'; o.frequency.value = 880
      g.gain.value = 0.05
      o.connect(g); g.connect(ctx.destination); o.start();
      setTimeout(()=>{o.stop(); ctx.close()},200)
    }catch(e){/* ignore */}
  }

  function updateTimerEl(t){
    const el = document.querySelector(`[data-id="${t.id}"]`)
    if(!el) return
    el.querySelector('.time').textContent = formatTime(t.remaining)
    const pct = t.initial>0 ? Math.max(0,Math.min(100, (1 - t.remaining/t.initial)*100)) : 100
    el.querySelector('.progress > i').style.width = pct + '%'
    el.querySelector('.btn.start').textContent = t.running ? 'Pausa' : 'Iniciar'
    if(t.remaining<=0){ el.querySelector('.time').classList.add('done') }
  }

  function render(){
    timersEl.innerHTML = ''
    timers.forEach(t=>{
      const node = document.createElement('div')
      node.className = 'timer'
      node.dataset.id = t.id
      node.innerHTML = `
        <div class="top">
          <div class="name">${t.name || 'Temporizador'}</div>
          <div class="time">${formatTime(t.remaining)}</div>
        </div>
        <div class="progress"><i style="width:0%"></i></div>
        <div class="controls-row">
          <button class="btn start primary">${t.running? 'Pausa':'Iniciar'}</button>
          <button class="btn reset">Reiniciar</button>
          <button class="btn delete">Eliminar</button>
        </div>
      `
      timersEl.appendChild(node)

      node.querySelector('.start').addEventListener('click', ()=>{
        t.running ? stopTimer(t) : startTimer(t)
      })
      node.querySelector('.reset').addEventListener('click', ()=>resetTimer(t))
      node.querySelector('.delete').addEventListener('click', ()=>removeTimer(t.id))
      updateTimerEl(t)
    })
  }

  addBtn.addEventListener('click', ()=>{
    const name = nameInput.value.trim()
    const m = parseInt(minInput.value||0,10) || 0
    const s = parseInt(secInput.value||0,10) || 0
    const total = m*60 + s
    if(total<=0) return
    createTimer(name,total)
    nameInput.value=''
    minInput.value='1'
    secInput.value='0'
  })

  // starter example
  createTimer('Cocina', 300)
  createTimer('Trabajo', 1500)

  // expose for debugging
  window._timers = timers
})();
