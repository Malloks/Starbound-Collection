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
  const grid       = document.getElementById('grid');
  const baseFolder = 'Bugs';
  const storageKey = 'bugStates';

  // 1) Load or initialize persistent state
  let bugStates = {};
  try {
    bugStates = JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    bugStates = {};
  }
  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(bugStates));
  }

  // 2) Mirror bugStates into gridStateBugs_v8 for general.js to read
  function updateBugsNavState() {
    const flat = {};
    Object.entries(bugStates).forEach(([folder, { collected }]) => {
      collected.forEach((hasJar, idx) => {
        flat[`${folder}-${idx}`] = { hasJar };
      });
    });
    localStorage.setItem('gridStateBugs_v8', JSON.stringify(flat));
  }

  // 3) Initialize default state for any missing folder
  const folders = Object.keys(tooltipData);
  folders.forEach(folder => {
    if (!bugStates[folder]) {
      bugStates[folder] = {
        clicked:   [false, false, false],
        collected: [false, false, false],
      };
    }
  });

  // 4) Render placeholders immediately into a fragment
  const frag = document.createDocumentFragment();
  folders.forEach(() => {
    const ph = document.createElement('div');
    ph.className = 'bug-container placeholder';
    frag.appendChild(ph);
  });
  grid.appendChild(frag);

  // 5) Fetch master folder list, then build real grid
  try {
    const listRes = await fetch(`/images?folder=${baseFolder}`);
    if (!listRes.ok) throw new Error('Failed to list ' + baseFolder);
    await listRes.json();

    // Replace placeholders with actual content
    folders.forEach((folder, i) => {
      const container = grid.children[i];
      container.innerHTML = '';
      container.className = 'bug-container';
      buildFolder(container, folder);
    });

    // Persist and mirror
    saveState();
    updateBugsNavState();

  } catch (err) {
    console.error('Error building Bugs grid:', err);
  }

  // ======================================================================
  // Helper: build one folder’s section (exactly your original logic)
  // ======================================================================
  async function buildFolder(container, folder) {
    // 5a) Nav-link toggling (mirrors pets.js)
    const bugsLink = document.querySelector('.navbar-links a[href$="bugs.html"]');
    function toggleBugsNavLink() {
      const state = JSON.parse(localStorage.getItem('gridStateBugs_v8')) || {};
      const allCaught = Object.values(state).length > 0
        && Object.values(state).every(s => s.hasJar);
      if (bugsLink) bugsLink.classList.toggle('completed', allCaught);
    }

    // 5b) Local state for this folder
    const slotState = bugStates[folder];

    // 5c) Header
    const title = document.createElement('div');
    title.className = 'set-name';
    title.textContent = folder;
    container.appendChild(title);

    // 5d) Big animation box + looping videos
    const bigBox = document.createElement('div');
    bigBox.className = 'big-container';
    bigBox.style.position = 'relative';

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
        imageRendering: 'pixelated',
        transition:     'opacity 200ms ease-in-out'
      });
      vid.addEventListener('loadedmetadata', () => {
        const delay = Math.random() * 1000;
        setTimeout(() => vid.play().catch(() => {}), delay);
      }, { once: true });

      allVideos.push(vid);
      bigBox.appendChild(vid);

      // If already collected, hide video and show done PNG
      if (slotState.collected[i-1]) {
        vid.pause();
        vid.style.visibility = 'hidden';
        const doneImg = document.createElement('img');
        doneImg.src                 = `/Images/${baseFolder}/${folder}/done/${i}.png`;
        doneImg.alt                 = `${folder} done ${i}`;
        doneImg.className           = 'animation-frame set-image';
        doneImg.dataset.doneOverlay = 'true';
        doneImg.dataset.slotIndex   = i-1;
        bigBox.appendChild(doneImg);
      }
    }
    container.appendChild(bigBox);

    // 5e) Icons row + click handlers
    const iconRes = await fetch(`/images?folder=${baseFolder}/${folder}`);
    if (!iconRes.ok) throw new Error('Failed to list icons for ' + folder);
    const paths = (await iconRes.json())
      .filter(p => p.toLowerCase().endsWith('.png'))
      .slice(0, 3);

    const iconsRow = document.createElement('div');
    iconsRow.className = 'icons-row';

    paths.forEach((path, idx) => {
      // Slot wrapper
      const iconSlot = document.createElement('div');
      iconSlot.className = `container container-${idx+2}`;
      iconSlot.setAttribute('data-category', 'Large');

      // Tooltip
      const tip = document.createElement('div');
      tip.className = 'tooltip';
      const data    = tooltipData[folder][idx];
      tip.innerHTML = `
        <div class="tooltip-title">${data.title}</div>
        <div class="tooltip-desc">${data.description}</div>
      `;
      iconSlot.appendChild(tip);

      // Icon image
      const icon = document.createElement('img');
      icon.src               = '/' + path;
      icon.alt               = `icon ${idx+1}`;
      icon.className         = 'set-image';
      Object.assign(icon.style, {
        cursor:         'pointer',
        imageRendering: 'pixelated'
      });
    // always give the drop-shadow, and if clicked add grayscale
    icon.style.filter = 'drop-shadow(5px 5px 5px #1a1a1a)'
                      + (slotState.clicked[idx] ? ' grayscale(100%)' : '');

      // Core click logic (unchanged)
      icon.addEventListener('click', () => {
        if (icon.dataset.busy === 'true') return;
        icon.dataset.busy = 'true';

        const wasClicked  = slotState.clicked[idx];
        const originalVid = allVideos[idx];

        if (!wasClicked) {
          // ==== DONE PATH ====
          slotState.clicked[idx]   = true;
          slotState.collected[idx] = true;
          saveState();
          updateBugsNavState();
          icon.style.filter = 'drop-shadow(4px 4px 6px rgba(0,0,0,0.5)) grayscale(100%)';

          // on loop end, play one-off “done” clip
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
            Object.assign(doneVid.style, {
              position:       'absolute',
              top:            '0',
              left:           '0',
              width:          '110%',
              height:         '110%',
              objectFit:      'contain',
              imageRendering: 'pixelated',
              zIndex:         '3',
              pointerEvents:  'none',
              transition:     'opacity 200ms ease-in-out'
            });

            doneVid.addEventListener('ended', () => {
              doneVid.remove();
              const doneImg = document.createElement('img');
              doneImg.src                 = `/Images/${baseFolder}/${folder}/done/${idx+1}.png`;
              doneImg.alt                 = `${folder} done ${idx+1}`;
              doneImg.className           = 'animation-frame set-image';
              doneImg.dataset.doneOverlay = 'true';
              doneImg.dataset.slotIndex   = idx;
              bigBox.appendChild(doneImg);
              icon.dataset.busy = 'false';
            }, { once: true });

            bigBox.appendChild(doneVid);
            doneVid.load();
            doneVid.play().catch(() => {});
          };

          if (originalVid.readyState < 1 || isNaN(originalVid.duration)) {
            originalVid.addEventListener('loadedmetadata', () => {
              setTimeout(onLoopEnd, (originalVid.duration - originalVid.currentTime) * 1000);
            }, { once: true });
          } else {
            setTimeout(onLoopEnd, (originalVid.duration - originalVid.currentTime) * 1000);
          }

        } else {
          // ==== RELEASE PATH ====
          slotState.clicked[idx]   = false;
          slotState.collected[idx] = false;
          saveState();
          updateBugsNavState();
          icon.style.filter = 'drop-shadow(5px 5px 5px #1a1a1a)';

          // remove done overlays
          bigBox.querySelectorAll(
            `[data-done-overlay][data-slot-index="${idx}"]`
          ).forEach(el => el.remove());

          // preload & play release clip
          const releaseVid = document.createElement('video');
          releaseVid.src         = `/Images/Animation/${baseFolder}/${folder}/${idx+1}release.webm`;
          releaseVid.preload     = 'auto';
          releaseVid.loop        = false;
          releaseVid.muted       = true;
          releaseVid.autoplay    = false;
          releaseVid.playsInline = true;
          releaseVid.className   = 'animation-frame set-video';
          Object.assign(releaseVid.style, {
            position:      'absolute',
            top:           '0',
            left:          '0',
            width:         '110%',
            height:        '110%',
            objectFit:     'contain',
            imageRendering:'pixelated',
            zIndex:        '3',
            pointerEvents: 'none'
          });
          bigBox.appendChild(releaseVid);

          releaseVid.addEventListener('loadedmetadata', () => {
            releaseVid.currentTime = 0;
            releaseVid.pause();
            setTimeout(() => releaseVid.play().catch(() => {}), 50);
          }, { once: true });

          releaseVid.addEventListener('ended', () => {
            releaseVid.remove();
            if (!bigBox.contains(originalVid)) {
              bigBox.appendChild(originalVid);
            }
            originalVid.style.visibility = 'visible';
            originalVid.currentTime = 0;
            originalVid.play().catch(() => {});
            icon.dataset.busy = 'false';
          }, { once: true });
        }
      });

      iconSlot.appendChild(icon);
      iconsRow.appendChild(iconSlot);
    });

    container.appendChild(iconsRow);
  }
});
