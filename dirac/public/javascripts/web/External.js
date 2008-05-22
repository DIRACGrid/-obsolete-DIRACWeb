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
  if(site){
    if((site=='volhcb01')||(site=='volhcb02')||(site=='volhcb03')||(site=='volhcb04')||(site=='volhcb05')||(site=='volhcb06')||(site=='volhcb07')){
      site = 'https://lemonweb.cern.ch/lemon-web/info.php?entity=' + site + '&detailed=yes';
    }else if((site=='LHCbDST')||(site=='LHCbRDST')||(site=='LHCbMDST')||(site=='LHCbUSER')||(site=='LHCbFAILOVER')||(site=='LHCbRAW')){
      site = 'https://santinel.web.cern.ch/santinel/sls/storage_space/' + site + '.html'
    }
  }
  var html = '<iframe id="www_frame" src =' + site + '></iframe>';
  var mainContent = new Ext.Panel({border:0,autoScroll:false,html:html,region:'center'})
  mainContent.on('resize',function(){
    var wwwFrame = document.getElementById('www_frame');
    wwwFrame.height = mainContent.getInnerHeight() - 4;
    wwwFrame.width = mainContent.getInnerWidth() - 4;
  })
  renderInMainViewport([ leftBar, mainContent ]);
}
