var refreshRate = 0; // autorefresh is off
var dataSelect , heartbeat , datagrid ;
function init(reponseSelect){
  dataSelect = reponseSelect;
  Ext.onReady(function(){
    heartbeat = new Ext.util.TaskRunner();
    Ext.override( Ext.PagingToolbar , {
      onRender :  Ext.PagingToolbar.prototype.onRender.createSequence(function(
        ct , position
      ){
        this.first.hide();
        for( var i = 9; i > 0 ; i-- ){
          Ext.fly( this.items.get( i ).getEl() ).remove() ;
          this.items.removeAt( i ) ;
        }
        this.loading.removeClass( 'x-btn-icon' );
        this.loading.setText( 'Refresh' );
        this.loading.addClass( 'x-btn-text-icon' );
      })
    });
    datagrid = initData();
    renderInMainViewport( [ initSidebar( datagrid ) , datagrid ] );
  });
}
function initSidebar( datagrid ){
  var select = selectPanel( datagrid );
  var bar = sideBar();
  bar.insert( 0 , select );
  bar.setTitle( 'SiteSummary' );
  var selectors = {
    'status': 'Status'
    ,'gridtype': 'GridType'
    ,'maskstatus': 'MaskStatus'
    ,'country': 'Country'
  };
  for( var i in selectors ){
    select.add( createMenu( i , selectors[ i ] ) );
  }
  return bar
}
function initData(){
  var record = new Ext.data.Record.create([
    {name:'GridType'},
    {name:'Site'},
    {name:'Country'},
    {name:'MaskStatus'},
    {name:'Received',type:'int'},
    {name:'Checking',type:'int'},
    {name:'Staging',type:'int'},
    {name:'Waiting',type:'int'},
    {name:'Matched',type:'int'},
    {name:'Running',type:'int'},
    {name:'Stalled',type:'int'},
    {name:'Done',type:'int'},
    {name:'Completed',type:'int'},
    {name:'Failed',type:'int'},
    {name:'Efficiency'},
    {name:'Status'},
    {name:'Tier'},
    {name:'FullCountry'},
    {name:'MaskStatusIcon',mapping:'MaskStatus'},
    {name:'SiteCheckbox',mapping:'Site'},
    {name:'StatusIcon',mapping:'Status'}
  ]);
  var store = initStore( record , { 'groupBy' : 'FullCountry' } );
  var sm = new Ext.grid.CheckboxSelectionModel({
    header: ''
  }) ;
  var columns = [
    sm,
    {header:'Name',sortable:true,dataIndex:'Site',align:'left',hideable:false},
    {header:'Tier',sortable:true,dataIndex:'Tier',align:'left'},
    {header:'GridType',sortable:true,dataIndex:'GridType',align:'left'},
    {header:'',width:26,sortable:false,dataIndex:'Country',renderer:flag,hideable:false,fixed:true,menuDisabled:true},
    {header:'Country',sortable:true,dataIndex:'FullCountry',align:'left'},
    {header:'',width:26,sortable:false,dataIndex:'MaskStatusIcon',renderer:status,hideable:false,fixed:true,menuDisabled:true},
    {header:'MaskStatus',sortable:true,dataIndex:'MaskStatus',align:'left'},
    {header:'Efficiency (%)',sortable:true,dataIndex:'Efficiency',align:'left'},
    {header:'',width:26,sortable:false,dataIndex:'StatusIcon',renderer:status,hideable:false,fixed:true,menuDisabled:true},
    {header:'Status',sortable:true,dataIndex:'Status',align:'left'},
    {header:'Received',sortable:true,dataIndex:'Received',align:'left',hidden:true},
    {header:'Checking',sortable:true,dataIndex:'Checking',align:'left',hidden:true},
    {header:'Staging',sortable:true,dataIndex:'Staging',align:'left'},
    {header:'Waiting',sortable:true,dataIndex:'Waiting',align:'left',hidden:true},
    {header:'Matched',sortable:true,dataIndex:'Matched',align:'left',hidden:true},
    {header:'Running',sortable:true,dataIndex:'Running',align:'left'},
    {header:'Completed',sortable:true,dataIndex:'Completed',align:'left'},
    {header:'Done',sortable:true,dataIndex:'Done',align:'left'},
    {header:'Stalled',sortable:true,dataIndex:'Stalled',align:'left'},
    {header:'Failed',sortable:true,dataIndex:'Failed',align:'left'}
  ];
  var autorefreshMenu = [{
    checked: setChk( 900000 )
    ,checkHandler: function(){ setRefresh( 900000 , datagrid ) }
    ,group: 'refresh'
    ,text: '15 Minutes'
  },{
    checked: setChk( 1800000 )
    ,checkHandler: function(){ setRefresh( 1800000 , datagrid ) }
    ,group: 'refresh'
    ,text: '30 Minutes'
  },{
    checked: setChk( 3600000 )
    ,checkHandler: function(){ setRefresh( 3600000 , datagrid ) }
    ,group: 'refresh'
    ,text: 'One Hour'
  },{
    checked: setChk( 0 )
    ,checkHandler: function(){ setRefresh( 0 ) }
    ,group: 'refresh'
    ,text: 'Disabled'
  }];
  var tbar = [{
    cls: 'x-btn-text-icon'
    ,handler: function(){ datagrid.getSelectionModel().selectAll() }
    ,icon: gURLRoot + '/images/iface/checked.gif'
    ,text: 'Select All'
    ,tooltip: 'Click to select all rows'
  },{
    cls: 'x-btn-text-icon'
    ,handler: function(){ datagrid.getSelectionModel().clearSelections() }
    ,icon: gURLRoot + '/images/iface/unchecked.gif'
    ,text: 'Select None'
    ,tooltip: 'Click to uncheck selected row(s)'
  },'->',{
    cls: 'x-btn-text-icon'
    ,handler: function(){ doAction( 'ban' , datagrid ) }
    ,icon: gURLRoot + '/images/iface/ban.gif'
    ,text: 'Ban'
    ,tooltip: 'Click to ban selected sites(s)'
  },{
    cls: 'x-btn-text-icon'
    ,handler: function(){ doAction( 'allow' , datagrid ) }
    ,icon: gURLRoot + '/images/iface/unban.gif'
    ,text: 'Allow'
    ,tooltip: 'Click to allow selected site(s)'
  }];
  var view = new Ext.grid.GroupingView({
    groupTextTpl: '<tpl if="datagrid.getStore().groupField==\'FullCountry\'">{group}:</tpl><tpl if="datagrid.getStore().groupField!=\'FullCountry\'">{text},</tpl> {[values.rs.length]} {[values.rs.length > 1 ? "Sites" : "Site"]}',
  })
  store.setDefaultSort('FullCountry','ASC'); // Default sorting
  var grid = new getDatagrid({
    autorefresh: autorefreshMenu
    ,disableIPP: true
    ,columns: columns
    ,sm: sm
    ,store: store
    ,tbar: tbar
    ,view: view
  });
  return grid
}
function getMenu( record ){
  var menu = new Ext.menu.Menu();
  var site = record.get( 'Site' );
  var showjobs = new Ext.menu.Item({
    handler:function(){ jump( 'site' , site ) }
    ,icon: gURLRoot + '/images/iface/go.gif'
    ,text:'Show Job(s)'
  });
  menu.add( showjobs );
  var ban = new Ext.menu.Item({
    handler: function(){
      actSite( 'ban' , new Array( site ) )
    }
    ,icon: gURLRoot + '/images/iface/ban.gif'
    ,text: 'Ban Site'  
  });
  var allow = new Ext.menu.Item({
    handler: function(){
          actSite( 'allow' , new Array( site ) )
    }
    ,icon: gURLRoot + '/images/iface/unban.gif'
    ,text: 'Allow Site'
  });

  var mask = record.get( 'MaskStatus' ) ;
  if( mask == 'Active' ){
    menu.add( ban );
  }else if( mask == 'Banned' ){
    menu.add( allow );
  }else{
    menu.add( ban );
    menu.add( allow );
  }
  return menu
}
function setChk(value){
  if(value == refreshRate){
    return true
  }else{
    return false
  }
}
function doAction( action , datagrid ){
  var selectModel = datagrid.getSelectionModel();
  var sitename = new Array();
  selectModel.each( function( record ){
    sitename.push( record.get( 'Site' ) );
  });
  var siteLength = sitename.length;
  if( siteLength <= 0 ){
    return showError( 'You should select at least one site' );
  }else{
    return actSite( action , sitename ) ;
  }
}
function setRefresh( time , datagrid ){
  if( time == 0 ){
    refreshRate = 0;
    heartbeat.stopAll();  
  }else{
    refreshRate = time;
    heartbeat.start({
      run:function(){
        datagrid.getStore().load();
      },
      interval: time
    });
  }
}
function actSite( action , sitename ){
  if( Ext.isEmpty( sitename , true ) ){
    return showError( 'Argument sitename in actSite function is missing' );
  }
  if( ! Ext.isArray( sitename ) ){
    return showError( 'Argument sitename in actSite function must be an array' );
  }
  if( Ext.isEmpty( action , true ) ){
    return showError( 'Argument action in actSite function is missing' );
  }
  actTitle = action.charAt( 0 ).toUpperCase() + action.slice( 1 );
  var title = actTitle + ' site';
  sitenameString = sitename.join( ', ' );
  var msg = 'Do you want to ' + action ;
  if( sitename.length > 1 ){
    msg = msg + ' the sites: ' + sitenameString + ' ?';
  }else{
    msg = msg + ' the site: ' + sitenameString + ' ?';
  }
  Ext.Msg.confirm( title , msg , function( btn ){
    if( btn == 'yes' ){
      ajax({
        mask: true
        ,params: { 'action' : action , 'name' : sitename }
        ,success: actionSuccess
      }) ;
    }
  });
  return
}
function actionSuccess( response ){
  Ext.getBody().unmask() ;
  if( Ext.isEmpty( response ) ){
    return showError( 'Argument response in actionSuccess function is missing' );
  }
  var msg = Ext.util.JSON.decode( response.responseText ) ;
  if( Ext.isEmpty( msg ) ){
    return showError( 'Server response is null or empty' );
  }
  if( !Ext.isEmpty( msg.success ) ){
    return datagrid.getStore().load() ;
  }
  if( !Ext.isEmpty( msg.error ) ){
    datagrid.getStore().load() ;
    return showError( msg.error );
  }
  return showError( 'Server response have no success or error messages' );
}
function jump(type,id){
  var url = document.location.protocol + '//' + document.location.hostname + gURLRoot + '/' + gPageDescription.selectedSetup
  url = url + '/' + gPageDescription.userData.group + '/jobs/JobMonitor/display';
  var post_req = '<form id="redirform" action="' + url + '" method="POST" >';
  post_req = post_req + '<input type="hidden" name="' + type + '" value="' + id + '">';
  post_req = post_req + '</form>';
  document.body.innerHTML = document.body.innerHTML + post_req;
  var form = document.getElementById('redirform');
  form.submit();
}
function afterDataLoad(){};
