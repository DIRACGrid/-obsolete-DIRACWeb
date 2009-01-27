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
    if((site=='volhcb01')||(site=='volhcb02')||(site=='volhcb03')||(site=='volhcb04')||(site=='volhcb05')||(site=='volhcb06')||(site=='volhcb07')||(site=='volhcb08')||(site=='volhcb09')||(site=='volhcb10')||(site=='volhcb11')){
      site = 'https://lemonweb.cern.ch/lemon-web/info.php?entity=' + site + '&detailed=yes';
    }else if((site=='LHCbDST')||(site=='LHCbRDST')||(site=='LHCbMDST')||(site=='LHCbUSER')||(site=='LHCbFAILOVER')||(site=='LHCbRAW')||(site=='LHCbMC-MDST')||(site=='LHCbMC-DST')){
      site = 'https://santinel.web.cern.ch/santinel/sls/storage_space/' + site + '.html';
    }else if((site == 'DIRAC-VOBOX')||(site == 'T1VOBOX')){
      site = 'https://sls.cern.ch/sls/service.php?id=' + site;
    }else if(site=='space token'){
      site = 'http://wn3.epcc.ed.ac.uk/srm/xml/srm_token_space';
    }else if(site == 'LHCb-SAM'){
      site = 'http://dashb-lhcb-sam.cern.ch/dashboard/request.py/latestresultssmry?siteSelect3=501&serviceTypeSelect3=vo&sites=CERN-PROD&sites=FZK-LCG2&sites=IN2P3-CC&sites=INFN-T1&sites=NIKHEF-ELPROD&sites=RAL-LCG2&sites=pic&services=CE&tests=37535&tests=398&tests=404&tests=405&tests=406&tests=403&tests=37415&tests=407&tests=399&exitStatus=all&table=true';
    }else if(site=='calendar'){
      site = 'http://romanov.web.cern.ch/romanov/Downtime/calendar.html';
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
