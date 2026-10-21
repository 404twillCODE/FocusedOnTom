import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
const wordmark=readFile(new URL('./watermark-wordmark.svg',import.meta.url),'utf8');
export async function watermarkedPreview(bytes,size) {
 const max=size==='thumb'?720:1600;
 const {data,info}=await sharp(bytes,{limitInputPixels:50_000_000}).rotate().resize({width:max,height:max,fit:'inside',withoutEnlargement:true}).toBuffer({resolveWithObject:true});
 const {width,height}=info,markWidth=Math.round(width*.68),markHeight=Math.round(Math.min(width*.15,height*.16));
 const logo=(await wordmark).replace('<svg ',`<svg x="${-markWidth/2}" y="${-markHeight/2}" width="${markWidth}" height="${markHeight}" `);
 // All lettering is outlined vector artwork: no host fonts or missing glyphs.
 const mark=Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="lines" width="72" height="72" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V72" stroke="white" stroke-opacity=".055"/></pattern></defs><rect width="100%" height="100%" fill="url(#lines)"/><g transform="translate(${width/2} ${height/2}) rotate(-17)" opacity="${size==='thumb'?'.28':'.40'}">${logo}</g></svg>`);
 return sharp(data).composite([{input:mark}]).webp({quality:78}).toBuffer();
}
