var dataSelect = new Object(); // Required to store the data for filters fields. Object.
var dataMngr = new Object(); // Used to store some user data
var tableMngr = new Object(); // Required to handle configuration data for table. Object.
function initLoop(){
  Ext.onReady(function(){
    var site = 'LCG.CERN.ch';
    if(window.location.hash){
      var test = window.location.hash.split('#site=');
      if(test.length == 2){
        site = test[1];
      }
    }else{
      window.location.hash = 'site=' + site;
    }
    var lBar = siteMenu(site);
    var mainContent = mainPanel();
    var right = rightPanelSet();
    renderInMainViewport([ lBar, right, mainContent ]);
  });
}
var simpleEncoding = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
function simpleEncode(valueArray,maxValue) {
  var chartData = ['s:'];
  for (var i = 0; i < valueArray.length; i++) {
    var currentValue = valueArray[i];
    if (!isNaN(currentValue) && currentValue >= 0) {
    chartData.push(simpleEncoding.charAt(Math.round((simpleEncoding.length-1) *
      currentValue / maxValue)));
    }
      else {
      chartData.push('_');
      }
  }
  return chartData.join('');
}
function statPanel(title,param,id){
  var reader = new Ext.data.ArrayReader({},[
    {name:'Status'},
    {name:'Number'}
  ]);
  var columns = [
    {header:'',width:26,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
    {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
    {header:'Numbers',sortable:true,dataIndex:'Number',align:'left'}
  ];
  var store = new Ext.data.Store({
    autoLoad:{params:param},
    proxy: new Ext.data.HttpProxy({
      url:'action',
      method:'POST',
    }),
    reader:reader
  });
  var panel = new Ext.grid.GridPanel({
    autoScroll:true,
    bbar:[{
      cls:"x-btn-text-icon",
      handler:function(){
        store.load({params:param});
        panel.doLayout();
      },
      icon:gURLRoot+'/images/iface/refresh.gif',
      tooltip:'Refresh statistics data',
      text:'Refresh',
    }],
    border:true,
    columns:columns,
    height:300,
    id:id + 'Panel',
    loadMask:true,
    minWidth: 200,
    monitorResize:true,
    rowspan:2,
    store:store,
    stripeRows:true,
    width: 200,
    title:title
  });
  panel.addListener('resize',function(){
    var tmpWidth = panel.getInnerWidth() - 6;
    var button = {
      cls:"x-btn-text-icon",
      handler:function(){
        store.load({params:param});
        panel.doLayout();
      },
      icon:gURLRoot+'/images/iface/refresh.gif',
      minWidth:tmpWidth,
      tooltip:'Refresh statistics data',
      text:'Refresh'
    };
    var bar = panel.getBottomToolbar();
    Ext.fly(bar.items.get(0).getEl()).remove();
    bar.items.removeAt(0);
    bar.insertButton(0,button);
    panel.doLayout();
  });
  store.on('load',function(x,data,params){
    var valueArraySolid = [];
    var valueArrayQuick = [];
    var chlS = '&chl=';
    var chcoS = '&chco=';
    var chlQ = '&chl=';
    var chcoQ = '&chco=';
    var name = 'globalStatJob';
    for(var i = 0; i < data.length; i++){
      var label = data[i].json[0];
      if(name == 'globalStatJob'){
        if((label=='Completed')||(label=='Done')||(label=='Failed')||(label=='Stalled')||(label=='Killed')){
          if(data[i].json[1]!='-'){
            valueArraySolid.push(data[i].json[1]);
            chlS = chlS + label + '|';
            chcoS = chcoS + statusColor(label) + '|';
          }
        }else{
          if(data[i].json[1]!='-'){
            valueArrayQuick.push(data[i].json[1]);
            chlQ = chlQ + label + '|';
            chcoQ = chcoQ + statusColor(label) + '|';
          }
        }
      }
    }
    chlS = chlS.substring(0,chlS.length-1);
    chcoS = chcoS.substring(0,chcoS.length-1);
    chlQ = chlQ.substring(0,chlQ.length-1);
    chcoQ = chcoQ.substring(0,chcoQ.length-1);
    Array.prototype.max = function () {
      if (this.length == 0) return undefined;
      var n = Number(this[0]);
      for (var i=1; i<this.length; i++) {n = Math.max(n, this[i])};
      return n;
    }
    var maxValueSolid = valueArraySolid.max();
    var maxValueQuick = valueArrayQuick.max();
    var chdS = simpleEncode(valueArraySolid, maxValueSolid);
    var chdQ = simpleEncode(valueArrayQuick, maxValueQuick);
    chdS = '&chd=' + chdS;
    chdQ = '&chd=' + chdQ;
    var imgURLS = 'http://chart.apis.google.com/chart?chs=190x190&cht=p' + chdS + chcoS + '&chtt=Finished+Jobs';
    var imgURLQ = 'http://chart.apis.google.com/chart?chs=190x190&cht=p' + chdQ + chcoQ + '&chtt=Current+Jobs';
    var imgS = document.getElementById(name + 'Solid');
    if(valueArraySolid.length > 0){
      imgS.src = imgURLS;
    }else{
      imgS.src = 'http://extjs.com/s.gif';
    }
    var imgQ = document.getElementById(name + 'Quick');
    if(valueArrayQuick.length > 0){
      imgQ.src = imgURLQ;
    }else{
      imgQ.src = 'http://extjs.com/s.gif';
    }
  });
  return panel;
}
function siteMenu(siteName){
  var store = new Ext.data.JsonStore({
    autoLoad:true,
    baseParams:{'siteList':true},
    fields:['site','code','mask'],
    idProperty:'name',
    root:'result',
    url:'action'
  });
  store.on('load',function(){
    if(siteName != ''){
      var result = store.find('site',siteName);
      if(result >= 0){
        var selectionMod = table.getSelectionModel();
        selectionMod.selectRow(result);
        simultaneousLoad(siteName);
      }else{
        alert('Error: Can not find the site named: ' + siteName);
        return
      }
    }
  });
  function syncButton(minWidth){
    if(!minWidth){
      minWidth = '';
    }
    var button = new Ext.Button({
      cls:"x-btn-text-icon",
      handler:function(){
        store.reload();
      },
      icon:gURLRoot+'/images/iface/refresh.gif',
      minWidth:minWidth,
      text:'Refresh',
      tooltip:'Updates the list of sites',
    });
    return button
  }
  var table = new Ext.grid.GridPanel({
    anchor:'-15',
    autoScroll:true,
    bbar:new Ext.Toolbar({
      items:[syncButton()]
    }),
    columns:[
      {dataIndex:'mask',id:'sl1',renderer:status,width:26,fixed:true,align:'left',menuDisabled:true,sortable:false,css:'cursor:pointer;cursor:hand;'},
      {dataIndex:'code',id:'sl2',renderer:flag,width:26,fixed:true,align:'left',menuDisabled:true,sortable:false,css:'cursor:pointer;cursor:hand;'},
      {dataIndex:'site',id:'sl3',align:'left',editable:false,sortable:false,css:'cursor:pointer;cursor:hand;'}
    ],
    collapsible:true,
    cmargins:'2 2 2 2',
    enableHdMenu:false,
    hideHeaders:true,
    id:'sidebarSiteSelectors',
    loadMask:true,
    margins:'2 0 2 0',
    minWidth: 200,
    name:'sidebarSiteSelectors',
    region:'west',
    split:true,
    store:store,
    stripeRows:true,
    title:'Site Statistics',
    width: 200,
    viewConfig:{forceFit:true,scrollOffset:1}
  });
  table.addListener('rowclick',function(tab,rowIndex){
    var record = tab.getStore().getAt(rowIndex); // Get the Record for the row
    try{
      if(record.data.site){
        dataSelect["selectedSite"] = record.data.site;
        window.location.hash = 'site=' + record.data.site;
        simultaneousLoad(record.data.site);
      }else{
        alert('Error: record.data.site is absent');
      }
    }catch(e){
      alert('Error: Unable to get the name of a site');
    }
  });
  table.addListener('resize',function(){
    var tmpWidth = table.getInnerWidth() - 6;
    var button = syncButton(tmpWidth);
    var bar = table.getBottomToolbar();
    Ext.fly(bar.items.get(0).getEl()).remove();
    bar.items.removeAt(0);
    bar.insertButton(0,button);
    table.doLayout();
  });
  return table
}
function rightPanelSet(){
  var height = Math.round((window.innerHeight - 40)/3);
  var infoPanel = new Ext.Panel({
    autoScroll:true,
    bbar:['->',{
      cls:"x-btn-text-icon",
      handler:function(){},
      icon:gURLRoot+'/images/iface/ban.gif',
      text:'Ban Site'
    },{
      cls:"x-btn-text-icon",
      handler:function(){},
      icon:gURLRoot+'/images/iface/unban.gif',
      text:'Unban site'
    }],
    bodyStyle:'padding: 5px',
    id:'siteInfoPanel',
    items:[{xtype:'label',text:'There is no data to display',colspan:2}],
    header:false,
    height:height,
    region: 'center',
  });
  var storagePanel = new Ext.Panel({
    autoScroll:true,
    bodyStyle:'padding: 5px',
    collapsible:true,
    cmargins:'2 0 2 0',
    id:'storagePanel',
    items:[{xtype:'label',text:'There is no data to display'}],
    region:'south',
    title:'Storage Services'
  });
  storagePanel.on({
    'collapse':function(){
      storagePanel.hide();
      panel.doLayout();
    }
  });
  var panel = new Ext.Panel({
    border:false,
    layout:'border',
    defaults:{
      split: true,
    },
    items:[infoPanel,storagePanel],
    id:'rightConteiner',
    margins:'2 0 2 0',
    minWidth:300,
    monitorResize:true,
    split:true,
    region:'center'
  });
  panel.on({
    'resize':function(){
      var height = Math.round((window.innerHeight - 40)/3);
      Ext.getCmp('storagePanel').setHeight(height);
    }
  });
  return panel
}
function mainPanel(){
  var width = 300;
  var left = Ext.getCmp('sidebarSiteSelectors');
  if(left){
    width = Math.round((window.innerWidth - left.width)/2);
  }
  var panel = new Ext.Panel({
    autoScroll:true,
    bodyStyle:'padding:5px;',
    id:'computingPanel',
    items:[{xtype:'label',text:'There is no data to display'}],
    margins:'2 0 2 0',
    minWidth:300,
    monitorResize:true,
    split: true,
    region:'east',
    title:'Computing Services',
    width:width
  });
  return panel
}
function returnImg(value){
  if((value == 'Done')||(value == 'Completed')||(value == 'Active')){
    return '<img src="'+gURLRoot+'/images/monitoring/done.gif">';
  }else if((value == 'Done')||(value == 'Completed')){
    return '<img src="'+gURLRoot+'/images/monitoring/failed.gif">';
  }else if(value == 'Probing'){
    return '<img src="'+gURLRoot+'/images/monitoring/waiting.gif">';
  }else{
    return '<img src="'+gURLRoot+'/images/monitoring/unknown.gif">';
  }
}
function simultaneousLoad(siteName){
  var sidebar = Ext.getCmp('sidebarSiteSelectors');
  sidebar.body.mask('<img src="'+gURLRoot+'/images/iface/loading.gif"> Loading...');
  Ext.Ajax.request({
    failure:function(response){
      sidebar.body.unmask();
      AJAXerror(response.responseText);
      return
    },
    method:'POST',
    params:{'siteName':siteName},
    success:function(response){
      sidebar.body.unmask();
      var jsonData = Ext.util.JSON.decode(response.responseText);
      if(jsonData['success'] == 'false'){
        alert('Error: ' + jsonData['error']);
        return;
      }else{
        loadData(jsonData['result']);
      }
    },
    url:'submit'
  });
  function loadData(response){

    var sitePanel = Ext.getCmp('siteInfoPanel');
    sitePanel.setTitle( createTitle(response.Site_Panel.Stat) );
    renderMainPanel(response.Site_Panel,sitePanel)

    var computingPanel = Ext.getCmp('computingPanel');
    computingPanel.setTitle( createTitle(response.Computing_Panel.Stat) );
    renderPanel(response.Computing_Panel.Info,computingPanel);
    var storagePanel = Ext.getCmp('storagePanel');
    if(response.Storage_Panel == 'None'){
      storagePanel.collapse(false);
    }else{
      storagePanel.show();
      sitePanel.doLayout();
      storagePanel.expand(true);
      storagePanel.setTitle( createTitle(response.Storage_Panel.Stat) );
      renderPanel(response.Storage_Panel.Info,storagePanel);
    }
    return
  }
}
function createTitle(info){
  var title = '';
  for(x in info){
    if(info[x]['DIRACStatus']){
      title = x+'&nbsp;'+returnImg(info[x]['DIRACStatus'])+'&nbsp;DIRAC:&nbsp;'+info[x]['DIRACStatus'];
    }else{
      title = x+'&nbsp;';
    }
    title = title + '&nbsp;'+returnImg(info[x]['RSSStatus'])+'&nbsp;RSS:&nbsp;'+info[x]['RSSStatus'];
  }
  return title
}
function renderPanel(data,panel){
  if(panel.items){
    for(j=panel.items.items.length;j>=0;j--){
      panel.remove(panel.items.items[j]);
    }
  }
  for(i in data){
    if(data[i].infos && data[i].desc && data[i].policy){
      if(data[i].infos[0].RSS){
//        var reader = new Ext.data.ArrayReader({},[
//          {name:'Name'},
//          {name:'Status'}
//        ]);
        var columns = [
          {header:'',width:26,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
          {header:'Name',sortable:true,dataIndex:'Name',align:'left'},
          {header:'Status',sortable:true,dataIndex:'Status',align:'left'}
        ];
        var store = new Ext.data.SimpleStore({
          fields:['Name','Status'],
          data:data[i].infos[0].RSS
        });
        var title = 'Undefined_Policy';
        var stat = 'No statistics available';
        var id = Ext.id(); 
        for(k in data[i].policy){
          id = k;
          title = k+':&nbsp;<b>'+data[i].policy[k][0]+'</b>';
          stat = data[i].policy[k][1];
        }
        var grid = new Ext.grid.GridPanel({
          columns:columns,
          bbar:[title,'->',stat],
          enableHdMenu:false,
          hideHeaders:true,
          header:false,
          id:id,
          layout:'fit',
          loadMask:true,
          margins:'5 5 5 5',
          store:store,
          stripeRows:true,
          viewConfig:{forceFit:true}
        });
        var menu = new Ext.menu.Menu();
        grid.addListener('rowclick',function(tab,rowIndex){
          var record = tab.getStore().getAt(rowIndex); // Get the Record for the row
          try{
            if(record.data.Name){
              var coords = Ext.EventObject.xy;
              menu.removeAll();
              if(tab.id == 'OnStorageServicePropagation_SE'){
                menu.add({handler:function(){request(tab,record.data.Name,'SE_View')},text:'Show SE details'});
              }else if(tab.id == 'OnStorageServicePropagation_Res'){
                menu.add({handler:function(){request(tab,record.data.Name,'Resource_View')},text:'Show Resource details'});
              }else if(tab.id == 'OnComputingServicePropagation'){
                menu.add({handler:function(){request(tab,record.data.Name,'Resource_View')},text:'Show Resource details'});
              }
              menu.showAt(coords);
            }else{
              alert('Error: record.data.Name is absent');
            }
          }catch(e){
            alert('Error: Unable to get the name of the node');
          }
        });
        panel.add(grid);
      }
    }
  }
  panel.doLayout();
  return
}
function renderMainPanel(data,panel){
  if(panel.items){
    for(j=panel.items.items.length;j>=0;j--){
      panel.remove(panel.items.items[j]);
    }
  }
  var site = 'Unknown';
  var title = '';
  if(data.Stat){
    for(x in data.Stat){
      site = x;
      if(data.Stat[x]['DIRACStatus']){
        title = returnImg(data.Stat[x]['DIRACStatus'])+'&nbsp;DIRAC:&nbsp;'+data.Stat[x]['DIRACStatus']+'&nbsp;';
      }
      title = title + returnImg(data.Stat[x]['RSSStatus'])+'&nbsp;RSS:&nbsp;'+data.Stat[x]['RSSStatus'];
    }
  }
  var overall = '';
  if(data.Info){
    for(y in data.Info){
      for(k in data.Info[y].policy){
        if(k == 'GGUSTickets'){
          overall = overall + '<b>GGUSTickets:</b>&nbsp;<a href="'+data.Info[y].infos[0]['WebLink']['GGUS_Link']+'">'+data.Info[y].policy[k][1]+'</a>';
        }
        if(k == 'DT_Scheduled'){
          overall = overall + '<b>DownTime:</b>&nbsp;'+data.Info[y].policy[k][1];
        }
/*
        if(k == 'OnSitePropagation'){
          overall = overall + '<b>Site Propagation:</b>&nbsp;'+data.Info[y].policy[k][1];
        }
*/
        overall = overall + '<br>';
      }
    }
  }
  var head = {xtype:'label',html:'<font size="28px">'+site+'</font><br>'+title+'<br><br>'+overall+'<br>'};
  var glJob = statPanel('WMS Statistics',{globalStatJob:'true',site:site},'glJob');

  var imgJobQuick = {border:false,html:'<img align="center" id="globalStatJobQuick" src="' + gURLRoot + '/ext/resources/images/default/grid/loading.gif">'};
  var imgJobSolid = {border:false,html:'<img align="center" id="globalStatJobSolid" src="' + gURLRoot + '/ext/resources/images/default/grid/loading.gif">'};
  var table = new Ext.Panel({
    border:false,
    layout:'table',
    layoutConfig: {
      columns:3
    },
    items: [glJob,imgJobQuick,imgJobSolid]
  });
  panel.add(head,table);
}
function request(panel,name,argument){
  panel.body.mask('<img src="'+gURLRoot+'/images/iface/loading.gif"> Loading...');
  Ext.Ajax.request({
    failure:function(response){
      panel.body.unmask();
      AJAXerror(response.responseText);
      return
    },
    method:'POST',
    params:{'nodeName':name,argument:argument},
    success:function(response){
      panel.body.unmask();
      var jsonData = Ext.util.JSON.decode(response.responseText);
      if(jsonData['success'] == 'false'){
        alert('Error: ' + jsonData['error']);
        return;
      }else{
        loadData(jsonData['result']);
      }
    },
    url:'action'
  });
  function loadData(data){
    var title = 'Undefined';
    if(data[0]['Resource_Panel']){
      data = data[0]['Resource_Panel'];
    }else if(data[0]['SE_Panel']){
      data = data[0]['SE_Panel'];
    }
    for(i in data[0]['Res']){
      title = i;
    }
    data = data[1]['InfoForPanel'];
    for(i in data){
      if(data[i].infos && data[i].desc && data[i].policy){
        if(data[i].infos[0].SAM){
          if(!data[i].infos[0].SAM['SAM-Status']){
            return
          }else{
            var tmpData = [];
            for(m in data[i].infos[0].SAM['SAM-Status']){
              tmpData.push([m,data[i].infos[0].SAM['SAM-Status'][m]]);
            }
          }
          var columns = [
            {header:'',width:26,sortable:false,dataIndex:'Status',renderer:status,hideable:false},
            {header:'Name',sortable:true,dataIndex:'Name',align:'left'},
            {header:'Status',sortable:true,dataIndex:'Status',align:'left'}
          ];
          var store = new Ext.data.SimpleStore({
            fields:['Name','Status'],
            data:tmpData
          });
          var stat = 'No statistics available';
          var id = Ext.id();
          var status = '';
          for(k in data[i].policy){
            id = k;
            status = k+':&nbsp;<b>'+data[i].policy[k][0]+'</b>';
            stat = data[i].policy[k][1];
          }
          var sam = new Ext.grid.GridPanel({
            bbar:[status,'->',stat],
            columns:columns,
            enableHdMenu:false,
            hideHeaders:true,
            header:false,
            id:id,
            layout:'fit',
            loadMask:true,
            margins:'5 5 5 5',
            store:store,
            stripeRows:true,
            viewConfig:{forceFit:true}
          });
        }else if (data[i].policy.DT_Scheduled){
          var web = '';
          if(data[i].infos[0].WebLink){
            web = '<a href="'+data[i].infos[0].WebLink+'">DownTime Description</a>'
          }
          var head = {xtype:'label',html:'<br><b>DownTime:</b>&nbsp;'+data[i].policy.DT_Scheduled[1]+web+'<br>'};
// Reserved for future usage
//        }else if(data[i].infos[0].FillChart){
//          return
        }
      }
    }
    if((!sam)||(!head)){
      alert();
      return
    }else{
      var panel = new Ext.Panel({
        autoScroll:true,
        border:false,
        items:[sam,head]
      });
    }
    var modal = false;
    var window = new Ext.Window({
      iconCls:'icon-grid',
      closable:true,
      width:600,
      height:400,
      border:true,
      collapsible:true,
      constrain:true,
      constrainHeader:true,
      maximizable:true,
      modal:modal,
      layout:'fit',
      plain:true,
      shim:false,
      title:title,
      items:[panel]
    });
    window.show();
    return window
  }
}
