/**
 * Convert an array of File objects to base64 data URL strings.
 * Supports images and videos with appropriate timeouts.
 */
export async function convertFilesToDataUrls(files: File[]): Promise<string[]> {
  console.log(`Starting conversion of ${files.length} file(s) to base64...`);

  const promises = files.map((file, index) => {
    return new Promise<string>((resolve, reject) => {
      const isVideo = file.type.startsWith('video/');

      console.log(
        `Converting file ${index + 1}/${files.length}: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)}MB)`
      );

      const timeoutDuration = isVideo ? 60000 : 30000;
      const timeoutId = setTimeout(() => {
        reject(new Error(`File ${file.name} took too long to process (${timeoutDuration / 1000}s timeout)`));
      }, timeoutDuration);

      const reader = new FileReader();

      reader.onloadstart = () => console.log(`Started reading file: ${file.name}`);

      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          if (percent % 25 === 0) console.log(`Reading ${file.name}: ${percent}%`);
        }
      };

      reader.onload = (e) => {
        clearTimeout(timeoutId);
        const result = e.target?.result as string;
        if (!result) {
          reject(new Error(`Failed to read file ${file.name} - no result`));
          return;
        }
        const base64SizeMB = result.length / 1024 / 1024;
        console.log(`Successfully converted ${file.name}: ${base64SizeMB.toFixed(2)}MB base64`);
        if (base64SizeMB > 10) {
          console.warn(`File ${file.name} is very large (${base64SizeMB.toFixed(2)}MB base64). This may cause issues.`);
        }
        resolve(result);
      };

      reader.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error(`Error reading file ${file.name}:`, error);
        reject(new Error(`Error reading file ${file.name}: ${error}`));
      };

      reader.onabort = () => {
        clearTimeout(timeoutId);
        console.error(`File ${file.name} read was aborted`);
        reject(new Error(`File ${file.name} read was aborted`));
      };

      try {
        reader.readAsDataURL(file);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Exception starting file read for ${file.name}:`, error);
        reject(new Error(`Failed to start reading file ${file.name}: ${error}`));
      }
    });
  });

  try {
    const results = await Promise.all(promises);
    const totalSize = results.reduce((sum, r) => sum + r.length, 0);
    console.log(`Successfully converted ${results.length} files to data URLs. Total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    return results;
  } catch (error) {
    console.error('Error converting files:', error);
    throw error;
  }
}
