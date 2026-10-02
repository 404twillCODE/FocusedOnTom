// Older bookmarks enter the same continuous journey at their original destination.
(() => {
 const pages=['behind-the-lens','inside-the-code','off-the-grid','explore-new-york','workshop'];
 const chapter=location.pathname.split('/').filter(Boolean)[0];
 if(pages.includes(chapter))location.replace('/'+(location.hash||'#'+chapter));
})();
