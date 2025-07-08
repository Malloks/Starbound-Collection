/*
 * bugs.js
 * Builds the Bugs grid using looping <video> for initial animations,
 * then on icon-click waits for loop-end, plays a one-off “done” <video>,
 * swaps to static PNG, caches clicked & collected state in localStorage.
 * Clicking again will “release” it: remove only this slot’s done overlays,
 * play a one-off “release” <video>, then resume the original loop.
 * While any animation is playing, that icon is marked busy.
 * Shows a tooltip bubble on hover with a title and description.
 */

// define your custom tooltip data per folder and per slot (0-indexed)
// The order of folders here determines load order.
const tooltipData = {
  Garden: [
    { title: "Butterbee", description: "Only during the day" },
    { title: "Fawnfly",   description: "All day" },
    { title: "Mudstag",   description: "All day" }
  ],
  Desert: [
    { title: "Goldbuck",   description: "All day" },
    { title: "Sandclown",  description: "All day" },
    { title: "Sunskipper", description: "Only during the day" }
  ],
  Forest: [
    { title: "Blueback",   description: "Only during the night" },
    { title: "Greentip",   description: "All day" },
    { title: "Redwing",    description: "All day" }
  ],
  Ocean: [
    { title: "Seahornet",  description: "All day" },
    { title: "Tidefly",    description: "Only during the night" },
    { title: "Wavebird",   description: "All day" }
  ],
  Savannah: [
    { title: "Dewhopper",  description: "All day" },
    { title: "Dustmoth",   description: "Only during the night" },
    { title: "Muddancer",  description: "All day" }
  ],
  Snow: [
    { title: "Frostfleck", description: "All day" },
    { title: "Frostfly",   description: "Only during the day" },
    { title: "Icetip",     description: "All day" }
  ],
  Mutated: [
    { title: "Hivehog",    description: "All day" },
    { title: "Shellcreep", description: "Only during the night" },
    { title: "Xenofly",    description: "All day" }
  ],
  Jungle: [
    { title: "Brightstripe", description: "Only during the day" },
    { title: "Thornbee",     description: "All day" },
    { title: "Vineclimber",  description: "All day" }
  ],
  Toxic: [
    { title: "Gasgiant",    description: "All day" },
    { title: "Scuttleploom",description: "All day" },
    { title: "Stinkjack",   description: "Only during the night" }
  ],
  Arctic: [
    { title: "Orphanfly",   description: "All day" },
    { title: "Polarmoth",   description: "Only during the night" },
    { title: "Snowskater",  description: "All day" }
  ],
  Tundra: [
    { title: "Aurorabee", description: "Only during the night" },
    { title: "Driftbell", description: "All day" },
    { title: "Shardwing", description: "All day" }
  ],
  Magma: [
    { title: "Fireygiant", description: "All day" },
    { title: "Flameroach", description: "Only during the day" },
    { title: "Lavahopper", description: "All day" }
  ],
  Decayed: [
    { title: "Ashsprite",  description: "All day" },
    { title: "Cinderfly",  description: "All day" },
    { title: "Shadowmoth", description: "Only during the night" }
  ],
  Volcanic: [
    { title: "Glowbug",    description: "All day" },
    { title: "Heathugger", description: "All day" },
    { title: "Phoenixfly", description: "Only during the day" }
  ]
};

document.addEventListener('DOMContentLoaded', async function() {
  const grid        = document.getElementById('grid');
  const baseFolder  = 'Bugs';
  const storageKey  = 'bugStates';

  // load or initialize persistent state
  let bugStates = {};
  try {
    bugStates = JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    bugStates = {};
  }
  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(bugStates));
  }

  // determine load order from tooltipData keys
  const folders = Object.keys(tooltipData);

  for (const folder of folders) {
    // ensure state entry
    if (!bugStates[folder]) {
      bugStates[folder] = {
        clicked:   [false, false, false],
        collected: [false, false, false]
      };
    }
  }

  try {
    // prefetch allPaths so we can list icon URLs per folder
    const listRes = await fetch(`/images?folder=${baseFolder}`);
    if (!listRes.ok) throw new Error('Failed to list ' + baseFolder);
    const allPaths = await listRes.json();

    // build each folder in order
    for (const folder of folders) {
      const slotState = bugStates[folder];

      // container
      const container = document.createElement('div');
      container.className = 'bug-container';

      // title
      const title = document.createElement('div');
      title.className = 'set-name';
      title.textContent = folder;
      container.appendChild(title);

      // big-box for videos
      const bigBox = document.createElement('div');
      bigBox.className = 'big-container';
      bigBox.style.position = 'relative';

      // store videos
      const allVideos = [];

      for (let i = 1; i <= 3; i++) {
        const vid = document.createElement('video');
        vid.src         = `/Images/Animation/${baseFolder}/${folder}/${i}.webm`;
        vid.loop        = true;
        vid.muted       = true;
        vid.playsInline = true;
        vid.autoplay    = false;
        vid.preload     = 'metadata';
        vid.className   = 'animation-frame set-video';
        Object.assign(vid.style, {
          display:        'block',
          objectFit:      'contain',
          imageRendering: 'pixelated'
        });

        // random startup delay
        vid.addEventListener('loadedmetadata', () => {
          const delay = Math.floor(Math.random()*1000) + 1;
          setTimeout(() => vid.play().catch(()=>{}), delay);
        }, { once: true });

        allVideos[i-1] = vid;

        if (!slotState.collected[i-1]) {
          bigBox.appendChild(vid);
        } else {
          // show static PNG
          const doneImg = new Image();
          doneImg.src               = `/Images/${baseFolder}/${folder}/done/${i}.png`;
          doneImg.alt               = `${folder} done ${i}`;
          doneImg.className         = 'animation-frame set-image';
          doneImg.dataset.doneOverlay = 'true';
          doneImg.dataset.slotIndex   = i-1;
          Object.assign(doneImg.style, {
            position:       'absolute',
            top:            '0',
            left:           '0',
            width:          '110%',
            height:         '110%',
            objectFit:      'contain',
            imageRendering: 'pixelated'
          });
          bigBox.appendChild(doneImg);
        }
      }

      container.appendChild(bigBox);

      // now list icons for this folder
      const iconRes = await fetch(`/images?folder=${baseFolder}/${folder}`);
      if (!iconRes.ok) throw new Error('Failed to list icons for ' + folder);
      const folderPaths = await iconRes.json();
      const icons = folderPaths.filter(p=>p.toLowerCase().endsWith('.png')).slice(0,3);

      const iconsRow = document.createElement('div');
      iconsRow.className = 'icons-row';

      icons.forEach((path, idx) => {
        const iconSlot = document.createElement('div');
        iconSlot.className = `container container-${idx+2}`;
        iconSlot.setAttribute('data-category','Large');

        // tooltip
        const tip = document.createElement('div');
        tip.className = 'tooltip';
        const data = tooltipData[folder][idx];
        if (data) {
          const h = document.createElement('div');
          h.className = 'tooltip-title';
          h.textContent = data.title;
          const d = document.createElement('div');
          d.className = 'tooltip-desc';
          d.textContent = data.description;
          tip.appendChild(h);
          tip.appendChild(d);
        } else {
          tip.textContent = `Info for ${folder} #${idx+1}`;
        }
        iconSlot.appendChild(tip);

        // icon image
        const icon = new Image();
        icon.src       = '/' + path;
        icon.alt       = `icon ${idx+1}`;
        icon.className = 'set-image';
        Object.assign(icon.style,{
          cursor:         'pointer',
          imageRendering: 'pixelated'
        });
        if (slotState.clicked[idx]) {
          icon.style.filter = 'grayscale(100%)';
        }

        icon.addEventListener('click', () => {
          if (icon.dataset.busy==='true') return;
          icon.dataset.busy = 'true';

          const wasClicked  = slotState.clicked[idx];
          const originalVid = allVideos[idx];

          if (!wasClicked) {
            // DONE path
            slotState.clicked[idx]   = true;
            slotState.collected[idx] = true;
            saveState();
            icon.style.filter = 'grayscale(100%)';

            const onLoopEnd = () => {
              originalVid.pause();
              originalVid.style.visibility = 'hidden';

              const doneVid = document.createElement('video');
              doneVid.src         = `/Images/Animation/${baseFolder}/${folder}/${idx+1}done.webm`;
              doneVid.loop        = false;
              doneVid.muted       = true;
              doneVid.autoplay    = true;
              doneVid.playsInline = true;
              doneVid.className   = 'animation-frame set-video';
              doneVid.dataset.doneOverlay = 'true';
              doneVid.dataset.slotIndex   = idx;
              Object.assign(doneVid.style,{
                position:       'absolute',
                top:            '0',
                left:           '0',
                width:          '110%',
                height:         '110%',
                objectFit:      'contain',
                imageRendering: 'pixelated',
                zIndex:         '3',
                pointerEvents:  'none'
              });

              doneVid.addEventListener('ended', () => {
                doneVid.remove();
                const doneImg = new Image();
                doneImg.src               = `/Images/${baseFolder}/${folder}/done/${idx+1}.png`;
                doneImg.alt               = `${folder} done ${idx+1}`;
                doneImg.className         = 'animation-frame set-image';
                doneImg.dataset.doneOverlay = 'true';
                doneImg.dataset.slotIndex   = idx;
                Object.assign(doneImg.style,{
                  position:       'absolute',
                  top:            '0',
                  left:           '0',
                  width:          '110%',
                  height:         '110%',
                  objectFit:      'contain',
                  imageRendering: 'pixelated'
                });
                bigBox.appendChild(doneImg);
                icon.dataset.busy = 'false';
              },{ once:true });

              bigBox.appendChild(doneVid);
              doneVid.load();
              doneVid.play().catch(()=>{});
            };

            if (originalVid.readyState<1||isNaN(originalVid.duration)) {
              originalVid.addEventListener('loadedmetadata',()=>{
                setTimeout(onLoopEnd,(originalVid.duration-originalVid.currentTime)*1000);
              },{ once:true });
            } else {
              setTimeout(onLoopEnd,(originalVid.duration-originalVid.currentTime)*1000);
            }

          } else {
            // RELEASE path
            slotState.clicked[idx]   = false;
            slotState.collected[idx] = false;
            saveState();
            icon.style.filter = '';

            bigBox.querySelectorAll(`[data-done-overlay][data-slot-index="${idx}"]`)
              .forEach(el=>el.remove());

            const releaseVid = document.createElement('video');
            releaseVid.src         = `/Images/Animation/${baseFolder}/${folder}/${idx+1}release.webm`;
            releaseVid.loop        = false;
            releaseVid.muted       = true;
            releaseVid.autoplay    = true;
            releaseVid.playsInline = true;
            releaseVid.className   = 'animation-frame set-video';
            Object.assign(releaseVid.style,{
              position:       'absolute',
              top:            '0',
              left:           '0',
              width:          '110%',
              height:         '110%',
              objectFit:      'contain',
              imageRendering: 'pixelated',
              zIndex:         '3',
              pointerEvents:  'none'
            });

            releaseVid.addEventListener('ended',()=>{
              releaseVid.remove();
              if (!bigBox.contains(originalVid)) {
                bigBox.appendChild(originalVid);
              }
              originalVid.style.visibility='visible';
              originalVid.currentTime=0;
              originalVid.play().catch(()=>{});
              icon.dataset.busy='false';
            },{ once:true });

            bigBox.appendChild(releaseVid);
            releaseVid.load();
            releaseVid.play().catch(()=>{});
          }
        });

        iconSlot.appendChild(icon);
        iconsRow.appendChild(iconSlot);
      });

      container.appendChild(iconsRow);
      grid.appendChild(container);
    }

    // save any new initial state
    saveState();
  } catch (err) {
    console.error('Error building Bugs grid:', err);
  }
});
