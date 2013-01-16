var refreshRate = 0; // autorefresh is off
var heartbeat , datagrid ;
function init( init ){
  Ext.onReady(function(){
    heartbeat = new Ext.util.TaskRunner();
    Ext.override( Ext.PagingToolbar , {
      onRender :  Ext.PagingToolbar.prototype.onRender.createSequence(function(
        ct , position
      ){
        this.first.hide();
        for( var i = 9 ; i > 0 ; i-- ){
          Ext.fly( this.items.get( i ).getEl() ).remove() ;
          this.items.removeAt( i ) ;
        }
        this.loading.removeClass( 'x-btn-icon' );
        this.loading.setText( 'Refresh' );
        this.loading.addClass( 'x-btn-text-icon' );
      })
    });
    Ext.Ajax.timeout = 1000 * 60 * 50 ;

    datagrid = new Ext.TabPanel({
      activeTab: 0
      ,items: [ sysInfo() ]
      ,margins:'2 0 2 0'
      ,region: 'center'
      ,split: true
    });
    if( init && init[ "hosts" ] ){
      for( var i = 0; i < init[ "hosts" ].length; i++){
        initData( init[ "hosts" ][ i ] );
      }
    }

    renderInMainViewport( [ initSidebar( datagrid ) , datagrid ] );
  });
}
function sysInfo(){
  var record = new Ext.data.Record.create([
    { name: 'Host' }
    ,{ name: 'Status' }
    ,{ name: 'Version' }
    ,{ name: 'Load1' }
    ,{ name: 'Load5' }
    ,{ name: 'Load15' }
    ,{ name: 'Memory' }
    ,{ name: 'Disk' }
    ,{ name: 'Swap' }
  ]);
  var store = new Ext.data.Store({
    autoLoad: true
    ,proxy: new Ext.data.HttpProxy({
      method: 'POST'
      ,timeout: 360000
      ,url: 'sysinfo'
    })
    ,reader: new Ext.data.JsonReader({
      root: 'result'
      ,totalProperty: 'total'
    } , record )
    ,sortInfo: { field: 'Host' , direction: 'ASC' }
  });
  var sm = new Ext.grid.CheckboxSelectionModel({
    header: ''
  }) ;
  var columns = [
    sm
  ,{
    align: 'left'
    ,dataIndex: 'Host'
    ,header: 'Hostname'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Status'
    ,header: 'Status'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Version'
    ,header: 'Version'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Load1'
    ,header: 'Load 1 minute'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Load5'
    ,header: 'Load 5 minutes'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Load15'
    ,header: 'Load 15 minutes'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Memory'
    ,fixed:true
    ,header: 'Memory'
    ,renderer: pbar
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Disk'
    ,header: 'Disk'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Swap'
    ,fixed:true
    ,header: 'Swap'
    ,renderer: pbar
    ,sortable: true
  }];
  var autorefreshMenu = [{
    checked: setChk( 900000 )
    ,checkHandler: function(){ setRefresh( 900000 , grid ) }
    ,group: 'refresh'
    ,text: '15 Minutes'
  },{
    checked: setChk( 1800000 )
    ,checkHandler: function(){ setRefresh( 1800000 , grid ) }
    ,group: 'refresh'
    ,text: '30 Minutes'
  },{
    checked: setChk( 3600000 )
    ,checkHandler: function(){ setRefresh( 3600000 , grid ) }
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
    ,handler: function(){ grid.getSelectionModel().selectAll() }
    ,icon: gURLRoot + '/images/iface/checked.gif'
    ,text: 'Select All'
    ,tooltip: 'Click to select all rows'
  },{
    cls: 'x-btn-text-icon'
    ,handler: function(){ grid.getSelectionModel().clearSelections() }
    ,icon: gURLRoot + '/images/iface/unchecked.gif'
    ,text: 'Select None'
    ,tooltip: 'Click to uncheck selected row(s)'
  },'->',{
    cls: 'x-btn-text-icon'
    ,handler: function(){ action( 'restart' , grid ) }
    ,icon: gURLRoot + '/images/iface/resetButton.gif'
    ,text: 'Restart'
    ,tooltip: 'Restart all DIRAC components except Web server'
  },{
    cls: 'x-btn-text-icon'
    ,handler: function(){ actionHost( 'update' ) }
    ,icon: gURLRoot + '/images/iface/lightning.png'
    ,text: 'Update'
    ,tooltip: 'Click to update DIRAC software'
//  },{
//    cls: 'x-btn-text-icon'
//    ,handler: function(){ actionHost( 'undo' ) }
//    ,icon: gURLRoot + '/images/iface/undo.png'
//    ,disabled: true
//    ,text: 'Revert'
//    ,tooltip: 'Replace <DIRACROOT>/pro link by <DIRACROOT>/old'
  }];
  var grid = new getDatagrid({
    autorefresh: autorefreshMenu
    ,disableIPP: true
    ,columns: columns
    ,region: undefined
    ,menu: menuHost
    ,sm: sm
    ,split: undefined
    ,store: store
    ,tbar: tbar
    ,title: 'Overall System Information'
  });
  grid.on( 'rowclick' , function( grid , rowIndex , e ){
    var record = grid.getStore().getAt( rowIndex );
    var host = record.get( 'Host' );
    if( Ext.isEmpty( host ) ){
      return showError( 'Failed to get value Host from data record' );
    }
    var tpanel = grid.findParentByType( 'tabpanel' );
//    var isTab = false ;
    var result = tpanel.findBy(function(){
      if( this.title == host ){
        tpanel.setActiveTab( this );
//        isTab = true;
      }
    });
//    if( ! isTab ){
//      return showError( 'Tab ' + host + ' does not exists' );
//    }
  });
  return grid
}

function menuHost( record , grid ){
  var menu = new Ext.menu.Menu();
  var host = record.get( 'Host' );
  var restart = new Ext.menu.Item({
    handler:function(){
      restartHost( host )
    }
    ,icon: gURLRoot + '/images/iface/resetButton.gif'
    ,text:'Restart'
  });
  menu.add( restart );
  var update = new Ext.menu.Item({
    handler:function(){
      updateHost( grid )
    }
    ,icon: gURLRoot + '/images/iface/lightning.png'
    ,text:'Update'
  });
  menu.add( update );
  var error = new Ext.menu.Item({
    handler:function(){
      errorDisplay( host );
    }
    ,icon: gURLRoot + '/images/iface/error.png'
    ,text:'Show Errors'
  });
  menu.add( error );
  return menu
}

function restartHost( host ){
  if( Ext.isEmpty( host ) ){
    return showError( 'Failed to get value Host from data record' );
  }
  if( ! Ext.isArray( host ) ){
    host = new Array( host );
  }
  var params = new Object();
  for( var i = 0 ; i < host.length ; i++ ){
    params[ host[ i ] ] = 'restart';  
  }
  var hostString = host.join( ', ' );
  var title = 'Restart DIRAC';
  var msg = 'Do you want to restart all DIRAC components on ';
  if( host.length > 1 ){
    title = title + ' components';
    msg = msg + ' the hosts: ' + hostString + ' ?';
  }else{
    title = title + ' component';
    msg = msg + ' the host: ' + hostString + ' ?';
  }
  Ext.Msg.confirm( title , msg , function( btn ){
    if( btn == 'yes' ){
      ajax({
        mask: true
        ,end: function(){ storeReload( host ) }
        ,params: params
        ,success: success
        ,url: 'restarthost'
      }) ;
    }
  });
  return  
}

function pbar( value ){
  if( ! value ){
    return
  }
  var id = Ext.id();
  var values = value.split( '/' );
  var text = values[ 1 ];
  var percent = values[ 0 ].replace( '%' , '' );
  percent = percent.replace( '.' , '' );
  if( percent.length < 2 ){
    percent = '0' + percent;
  }
  percent = '.' + percent;
  (function(){
    new Ext.ProgressBar({
      height: 14
      ,renderTo: id
      ,text: text
      ,value: percent
    });
  }).defer(25)
  return '<span id="' + id + '"></span>';
}
function showInfo( response , panel ){
  if(! Ext.isEmpty( response.DiskOccupancy ) ){
    var disk = response.DiskOccupancy.split( ',' );
    for( var i = 0 ; i < disk.length ; i++ ){
      var values = disk[ i ].split( ':' );
      var percent = values[1].replace( '%' , '' );
      if( percent.length < 2 ){
        percent = '0' + percent;
      }
      percent = '.' + percent;
      var tmp = new Ext.ProgressBar({
        text: values[ 0 ]
        ,value: percent
//        ,width: 300
      });
      panel.add( tmp );
    }
  }
  panel.doLayout();
}
function initSidebar(){
  var result = [
    '<a href="#" onclick="javascript:sendMessage()">Send a message</a>'
    ,'<a href="#" onclick="javascript:sendMail()">Send an e-mail</a>'
  ]
  var html = '<ul>';
  for( var i = 0 ; i < result.length ; i++ ){
    html = html + '<li class="tinny">' + result[ i ] + '</li>';
  }
  html = html + '</ul>' ;
  var panel = new Ext.Panel({
    autoScroll:true,
    bodyStyle:'padding: 5px',
    html: html,
    split:true,
    region:'west',
    collapsible:true,
    width: 200,
    minWidth: 200,
    margins:'2 0 2 0',
    title:'SystemAdministration',
  });
  return panel;
}
function initData( host ){
  var record = new Ext.data.Record.create([
    { name: 'System' }
    ,{ name: 'Host' }
    ,{ name: 'Name' }
    ,{ name: 'Setup' }
    ,{ name: 'PID' }
    ,{ name: 'RunitStatus' }
    ,{ name: 'Module' }
    ,{ name: 'Installed' }
    ,{ name: 'Timeup' }
    ,{ name: 'Type' }
  ]);
  var store = new Ext.data.GroupingStore({
    autoLoad: true
    ,baseParams: { hostname : host}
    ,groupField: 'Type'
    ,proxy: new Ext.data.HttpProxy({
      method: 'POST'
      ,url: 'submit'
    })
    ,reader: new Ext.data.JsonReader({
      root: 'result'
      ,totalProperty: 'total'
    } , record )
  });
  store.on('load',function(){
    datagrid.add( grid );
  });
  var sm = new Ext.grid.CheckboxSelectionModel({
    header: ''
  }) ;
  var columns = [
    sm
  ,{
    align: 'left'
    ,dataIndex: 'System'
    ,header: 'System'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Name'
    ,header: 'Name'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Module'
    ,header: 'Module'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Type'
    ,header: 'Type'
    ,sortable: true
/*
  },{
    align: 'left'
    ,dataIndex: 'Setup'
    ,header: 'Setup'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Installed'
    ,header: 'Installed'
    ,sortable: true
*/
  },{
    align: 'left'
    ,dataIndex: 'RunitStatus'
    ,header: 'Status'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Timeup'
    ,header: 'Uptime'
    ,renderer: uptime
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'PID'
    ,header: 'PID'
    ,sortable: true
  }];
  var autorefreshMenu = [{
    checked: setChk( 900000 )
    ,checkHandler: function(){ setRefresh( 900000 , grid ) }
    ,group: 'refresh'
    ,text: '15 Minutes'
  },{
    checked: setChk( 1800000 )
    ,checkHandler: function(){ setRefresh( 1800000 , grid ) }
    ,group: 'refresh'
    ,text: '30 Minutes'
  },{
    checked: setChk( 3600000 )
    ,checkHandler: function(){ setRefresh( 3600000 , grid ) }
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
    ,handler: function(){ grid.getSelectionModel().selectAll() }
    ,icon: gURLRoot + '/images/iface/checked.gif'
    ,text: 'Select All'
    ,tooltip: 'Click to select all rows'
  },{
    cls: 'x-btn-text-icon'
    ,handler: function(){ grid.getSelectionModel().clearSelections() }
    ,icon: gURLRoot + '/images/iface/unchecked.gif'
    ,text: 'Select None'
    ,tooltip: 'Click to uncheck selected row(s)'
  },'->',{
    cls: 'x-btn-text-icon'
    ,handler: function(){ action( 'restart' , grid ) }
    ,icon: gURLRoot + '/images/iface/resetButton.gif'
    ,text: 'Restart'
    ,tooltip: 'Click to restart selected service(s), agent(s) or mind(s)'
  },{
    cls: 'x-btn-text-icon'
    ,handler: function(){ action( 'start' , grid ) }
    ,icon: gURLRoot + '/images/iface/submit.gif'
    ,text: 'Start'
    ,tooltip: 'Click to start selected service(s), agent(s) or mind(s)'
  },{
    cls: 'x-btn-text-icon'
    ,handler: function(){ action( 'stop' , grid ) }
    ,icon: gURLRoot + '/images/iface/ban.gif'
    ,text: 'Stop'
    ,tooltip: 'Click to stop selected service(s), agent(s) or mind(s)'
  }];
  var view = new Ext.grid.GroupingView({
    groupTextTpl: '{[values.rs.length]} {[values.rs.length > 1 ?' +
                  ' "Records" : "Record"]} ({text})'
    ,hideGroupedColumn: true
  })
  store.setDefaultSort('Type','ASC'); // Default sorting
  var grid = new getDatagrid({
    autorefresh: autorefreshMenu
    ,disableIPP: true
    ,columns: columns
    ,region: undefined
    ,menu: getMenu
    ,sm: sm
    ,split: undefined
    ,store: store
    ,tbar: tbar
    ,title: host
    ,view: view
  });
  return grid
}
function uptime( value , cell , record ){
  if( record.get( 'RunitStatus' ) != 'Run' ){
    return '<b>&mdash;</b>'
  }
  if( value < 30 ){
    return '<font color="#FF3300"><b>' + value + '</b></font>' ;
  }
  if( value < ( 60 * 5 ) ){
    return '<font color="#FFCC00"><b>' + value + '</b></font>' ;
  }
  if( value < ( 60 * 10 ) ){
    return '<font color="#00CC00">' + value + '</font>' ;
  }
  return value ;
}
function getMenu( record , grid ){
  var menu = new Ext.menu.Menu();
  var host = record.get( 'Host' );
  var entity = record.get( 'Type' , 'Entity' );
  var restart = new Ext.menu.Item({
    handler:function(){
      action( 'restart' , grid )
    }
    ,icon: gURLRoot + '/images/iface/resetButton.gif'
    ,text:'Restart ' + entity
  });
  menu.add( restart );
  var stop = new Ext.menu.Item({
    handler: function(){
      action( 'stop' , grid )
    }
    ,icon: gURLRoot + '/images/iface/ban.gif'
    ,text: 'Stop ' + entity
  });
  var start = new Ext.menu.Item({
    handler: function(){
      action( 'start' , grid )
    }
    ,icon: gURLRoot + '/images/iface/submit.gif'
    ,text: 'Start ' + entity
  });

  var status = record.get( 'RunitStatus' ) ;
  if( status == 'Run' ){
    menu.add( stop );
  }else if( status == 'Down' ){
    menu.add( start );
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
function setRefresh( time , tab ){
  if( time == 0 ){
    refreshRate = 0;
    heartbeat.stopAll();  
  }else{
    refreshRate = time;
    heartbeat.start({
      run:function(){
        tab.getStore().load();
      },
      interval: time
    });
  }
}
function action( action , grid ){
  var selectModel = grid.getSelectionModel();
  if( ! selectModel.getCount() > 0 ){
    return showError( 'You should select at least one record' );
  }
  var params = new Object();
  var cmpName = new Array();
  params.action = action;
  selectModel.each( function( record ){
    var target = record.get( 'Name' ) + ' @ ' + record.get( 'Host' );
    if( ! params[ target ] ){
      params[ target ] = new Array();
    }
    var sys = record.get( 'System' );
    params[ target ].push( sys );
    cmpName.push( target );
  });

  var paramString = cmpName.join( ', ' );
  var title = action.charAt( 0 ).toUpperCase() + action.slice( 1 );
  var msg = 'Do you want to ' + action ;
  if( cmpName.length > 1 ){
    title = title + ' components'; 
    msg = msg + ' the components: ' + paramString + ' ?';
  }else{
    title = title + ' component'; 
    msg = msg + ' the component: ' + paramString + ' ?';
  }

  Ext.Msg.confirm( title , msg , function( btn ){
    if( btn == 'yes' ){
      ajax({
        end: function(){
          grid.getStore().load()
        }
        ,mask: true
        ,params: params
        ,success: success
      }) ;
    }
  });
  return
}

function success( response , opt ){
  Ext.getBody().unmask();
  var msg = Ext.util.JSON.decode( response.responseText ) ;
  if( Ext.isEmpty( msg ) ){
    return showError( 'Server response is null or empty' );
  }
  if( ! Ext.isEmpty( msg.error ) ){
    return showError( msg.error );
  }
  if( ! Ext.isEmpty( opt.end ) ){
    opt.end();
  }
  if( ! Ext.isEmpty( msg.result ) ){
    return showTip( msg.result );
  }
  return showError( 'Server response have no success nor error messages' );
}

function showTip( text ){
  var msg = new Ext.Tip({
    baseCls:'success'
    ,floating: true
    ,html: text
    ,width: 300
  });
  var x = Ext.num( Ext.getBody().getViewSize().width , 640 );
  x = ( ( x / 2 ) - ( msg.width / 2 ) );
  setTimeout( function(){ msg.destroy() } , 3000 );
  return msg.showAt( [ x , 5 ] );
}

function afterDataLoad(){}
