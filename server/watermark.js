import sharp from 'sharp';
export async function watermarkedPreview(bytes,size) {
  const max=size==='thumb'?720:1600;
  const {data,info}=await sharp(bytes,{limitInputPixels:50_000_000}).rotate().resize({width:max,height:max,fit:'inside',withoutEnlargement:true}).toBuffer({resolveWithObject:true});
  const {width,height}=info, font=Math.max(14,Math.round(width*.043));
  // Composited into the actual pixels, not a removable HTML/CSS overlay.
  const mark=Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="lines" width="90" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 0V90" stroke="white" stroke-opacity=".075"/></pattern></defs><rect width="100%" height="100%" fill="url(#lines)"/><g transform="translate(${width/2} ${height/2}) rotate(-17)"><text text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${font}" font-weight="700" letter-spacing="${font*.15}" fill="white" fill-opacity=".48" stroke="black" stroke-opacity=".3" stroke-width=".8">T&amp;E VISUALS</text></g><text x="${width-16}" y="${height-16}" text-anchor="end" font-family="Arial,sans-serif" font-size="${Math.max(10,font*.35)}" fill="white" fill-opacity=".65">PREVIEW · THOMAS WILLIAMS</text></svg>`);
  return sharp(data).composite([{input:mark}]).webp({quality:78}).toBuffer();
}
