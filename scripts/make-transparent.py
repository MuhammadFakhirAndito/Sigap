import sys
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

def extract_subject(input_path, output_path, tolerance=20):
    img = Image.open(input_path).convert("RGBA")
    arr = np.array(img)
    h, w, _ = arr.shape
    
    # Background color sample from 4 corners
    corners = [
        arr[0, 0, :3].astype(float),
        arr[0, w-1, :3].astype(float),
        arr[h-1, 0, :3].astype(float),
        arr[h-1, w-1, :3].astype(float)
    ]
    bg_color = np.mean(corners, axis=0)
    print(f"Sampled BG color: {bg_color}")
    
    # Euclidean distance from BG color in RGB space
    diff = np.sqrt(np.sum((arr[:, :, :3].astype(float) - bg_color) ** 2, axis=2))
    
    # Flood fill from perimeter
    visited = np.zeros((h, w), dtype=bool)
    queue = deque()
    
    for x in range(w):
        if diff[0, x] < tolerance:
            queue.append((0, x))
            visited[0, x] = True
        if diff[h-1, x] < tolerance and not visited[h-1, x]:
            queue.append((h-1, x))
            visited[h-1, x] = True
            
    for y in range(h):
        if diff[y, 0] < tolerance and not visited[y, 0]:
            queue.append((y, 0))
            visited[y, 0] = True
        if diff[y, w-1] < tolerance and not visited[y, w-1]:
            queue.append((y, w-1))
            visited[y, w-1] = True
            
    while queue:
        cy, cx = queue.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                if diff[ny, nx] < tolerance:
                    visited[ny, nx] = True
                    queue.append((ny, nx))
                    
    alpha_mask = np.ones((h, w), dtype=np.uint8) * 255
    alpha_mask[visited] = 0
    
    alpha_img = Image.fromarray(alpha_mask, mode="L")
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=0.7))
    
    img.putalpha(alpha_img)
    img.save(output_path, "PNG")
    print(f"Successfully saved transparent PNG to {output_path}")

if __name__ == "__main__":
    src = sys.argv[1]
    dst = sys.argv[2]
    extract_subject(src, dst)
