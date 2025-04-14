console.log("Etherscan ETH Address Icon extension loaded");
/**
 * Returns a seeded pseudo-random function using the Mulberry32 algorithm.
 * The seed is a 32-bit integer.
 */
function mulberry32(a) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}
/**
 * Generates a square mandala icon for a given Ethereum address.
 *
 * @param {string} address - ETH Address
 * @param {number} size - The width and height of the canvas in pixels.
 * @return {HTMLCanvasElement} - The canvas element containing the mandala.
 */
function generateMandalaIcon(address, size = 32) {

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (address.toLowerCase().startsWith("0x")) {
        address = address.slice(2);
    }
    address = address.toLowerCase();

    const seedSource = address.slice(-8);
    const seed = parseInt(seedSource, 16) || 1;
    const rand = mulberry32(seed);

    const layers = 3;
    const maxRadius = (size / 2) * 0.9;
    const cx = size / 2, cy = size / 2;
    const segments = Math.floor(rand() * (12 - 6 + 1)) + 6;
    /**
     * Draws one ring of the mandala.
     * @param {number} inner - Inner radius for this ring.
     * @param {number} outer - Outer radius for this ring.
     * @param {number} segments - Number of petals to draw.
     * @param {number} perturbation - Fraction for random size perturbation.
     * @param {number} petalAngleWidthFactor - Fraction of the full segment used by a petal.
     */
    function drawRing(inner, outer, segments, perturbation = 0.1, petalAngleWidthFactor = 0.8) {
        const segmentAngle = 2 * Math.PI / segments;
        const petalAngleWidth = segmentAngle * petalAngleWidthFactor;
        const pointsPerEdge = 10;
        for (let i = 0; i < segments; i++) {
            const baseAngle = 2 * Math.PI * i / segments;
            const startAngle = baseAngle - petalAngleWidth / 2;
            const endAngle = baseAngle + petalAngleWidth / 2;
            ctx.beginPath();

            for (let j = 0; j < pointsPerEdge; j++) {
                const theta = startAngle + (j / (pointsPerEdge - 1)) * (endAngle - startAngle);
                const rPerturb = outer * (1 + (rand() * 2 - 1) * perturbation);
                const x = cx + rPerturb * Math.cos(theta);
                const y = cy + rPerturb * Math.sin(theta);
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            for (let j = pointsPerEdge - 1; j >= 0; j--) {
                const theta = startAngle + (j / (pointsPerEdge - 1)) * (endAngle - startAngle);
                const rPerturb = inner * (1 + (rand() * 2 - 1) * perturbation);
                const x = cx + rPerturb * Math.cos(theta);
                const y = cy + rPerturb * Math.sin(theta);
                ctx.lineTo(x, y);
            }
            ctx.closePath();

            const rCol = Math.floor(rand() * 256);
            const gCol = Math.floor(rand() * 256);
            const bCol = Math.floor(rand() * 256);
            ctx.fillStyle = `rgb(${rCol}, ${gCol}, ${bCol})`;
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
    }

    for (let layer = 1; layer <= layers; layer++) {
        const innerRadius = ((layer - 1) / layers) * maxRadius;
        const outerRadius = (layer / layers) * maxRadius;
        drawRing(innerRadius, outerRadius, segments, 0.1, 0.8);
    }

    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.05, 0, 2 * Math.PI);
    const rCenter = Math.floor(rand() * 256);
    const gCenter = Math.floor(rand() * 256);
    const bCenter = Math.floor(rand() * 256);
    ctx.fillStyle = `rgb(${rCenter}, ${gCenter}, ${bCenter})`;
    ctx.fill();
    ctx.stroke();
    return canvas;
}
/**
 * Generates a pixel grid identicon icon for a given ETH address.
 *
 * @param {string} address - ETH address.
 * @param {number} size - The overall size (width and height) of the canvas.
 * @param {number} gridSize - The number of cells per row/column.
 * @return {HTMLCanvasElement} - The canvas element containing the identicon.
 */
function generateIdenticon(address, size = 32, gridSize = 5) {

    address = address.toLowerCase().replace(/^0x/, '');

    const seedSource = address.slice(-8);
    const seed = parseInt(seedSource, 16) || 1;
    const rand = mulberry32(seed);

    const r = Math.floor(rand() * 256);
    const g = Math.floor(rand() * 256);
    const b = Math.floor(rand() * 256);
    const baseColor = `rgb(${r},${g},${b})`;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgb(240,240,240)';
    ctx.fillRect(0, 0, size, size);
    const cellSize = size / gridSize;
    const cols = Math.ceil(gridSize / 2);
    let pattern = [];

    for (let i = 0; i < gridSize * cols; i++) {
        pattern.push(rand() > 0.5);
    }

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            let val;
            if (col < cols) {
                val = pattern[row * cols + col];
            } else {
                const mirrorCol = gridSize - col - 1;
                val = pattern[row * cols + mirrorCol];
            }
            if (val) {
                ctx.fillStyle = baseColor;
                ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
            }
        }
    }
    return canvas;
}

chrome.storage.sync.get({ iconType: "mandala" }, (data) => {
    const iconType = data.iconType;
    function addIconsToAddresses() {

        const selectors = [
            'a[data-highlight-target]',
            '#spanTxHash',
            '#ContentPlaceHolder1_trContract > div > a:nth-child(1) > span',
            '#transactions a.hash-tag.myFnExpandBox_searchVal',
            '#transactions > div > div.table-responsive > table > tbody > tr > td:nth-child(11) > div > div > span > span',
            '#transactions > div > div.table-responsive > table > tbody > tr > td:nth-child(11) > div > span > span'
        ];

        const combinedSelector = selectors.join(',');

        const ethAddressLinks = document.querySelectorAll(combinedSelector);
        ethAddressLinks.forEach(link => {
            if (link.classList.contains("eth-icon-generated")) return;
            const address = link.getAttribute('data-highlight-target') || link.textContent.trim();
            if (!address) return;
            let iconCanvas;
            if (iconType === "identicon") {
                iconCanvas = generateIdenticon(address, 32, 5);
            } else {
                iconCanvas = generateMandalaIcon(address, 32);
            }
            iconCanvas.style.verticalAlign = 'middle';
            iconCanvas.style.marginLeft = '4px';
            link.insertAdjacentElement('afterend', iconCanvas);
            link.classList.add("eth-icon-generated");
        });
    }

    addIconsToAddresses();

    const observer = new MutationObserver(addIconsToAddresses);
    observer.observe(document.body, { childList: true, subtree: true });
});
