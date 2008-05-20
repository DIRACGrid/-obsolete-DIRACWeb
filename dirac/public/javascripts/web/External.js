// Main routine
function initJobMonitor(reponseSelect){
  Ext.onReady(function(){
    renderData(reponseSelect);
  });
}
// function describing data structure, should be individual per page
// Initialisation of selection sidebar, all changes with selection items should goes here
function renderData(site){
  var leftBar = new Ext.Panel();
  leftBar.hide();
  site = 'https://lemonweb.cern.ch/lemon-web/info.php?entity=' + site + '&detailed=yes';
  var html = '<iframe id="www_frame" src =' + site + '></iframe>';
  var mainContent = new Ext.Panel({border:0,autoScroll:false,html:html,region:'center'})
  mainContent.on('resize',function(){
    var wwwFrame = document.getElementById('www_frame');
    wwwFrame.height = mainContent.getInnerHeight() - 4;
    wwwFrame.width = mainContent.getInnerWidth() - 4;
  })
  renderInMainViewport([ leftBar, mainContent ]);
}
