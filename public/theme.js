// Runs before the page paints so the right theme shows immediately.
(function(){
  var saved=null; try{ saved=localStorage.getItem("tc_theme"); }catch(e){}
  var dark = saved ? saved==="dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", dark?"dark":"light");
})();
