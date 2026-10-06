export async function loadHeightmap(url: string): Promise<number[][]> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onerror = () => reject(new Error(`Failed to load heightmap: ${url}`));
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0);
            const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);

            const grid: number[][] = [];
            for (let y = 0; y < height; y++) {
                const row: number[] = [];
                for (let x = 0; x < width; x++) {
                    const i = (y * width + x) * 4;
                    row.push(1 - data[i] / 255); // red channel, normalized 0–1, inverted
                }
                grid.push(row);
            }
            resolve(grid);
        };
        img.src = url;
    });
}
