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
    ,icon: gURLRoot + '/images/iface/resetButton.gif'
    ,text: 'Restart'
    ,tooltip: 'Restart all DIRAC components except Web server'
//  },{
//    cls: 'x-btn-text-icon'
//    ,icon: gURLRoot + '/images/iface/lightning.png'
//    ,text: 'Update'
//    ,tooltip: 'Click to update DIRAC software'
  }];
  for( var i = 0 ; i < tbar.length ; i++ ){
    tbar[ i ] = new Ext.Toolbar.Button( tbar[ i ] );
    tbar[ i ].on( 'click' , function( btn ){
      var act = new action( grid.getSelectionModel().getSelections() );
      act.doHostAction( btn.text );
    });
  }  
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
  grid.on( 'rowdblclick' , function( grid , rowIndex , e ){
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

function menuHost( record ){
  var host = record.get( 'Host' );
  var act = new action( [ record ] );
  var menu = new Ext.menu.Menu({
    items:[{
      handler:function(){
        act.doHostAction( 'restart' );
      }
      ,icon: gURLRoot + '/images/iface/resetButton.gif'
      ,text:'Restart'
      /*
    },{
      handler:function(){
        act.doHostAction( 'update' );
      }
      ,icon: gURLRoot + '/images/iface/lightning.png'
      ,text:'Update'
    },{
      handler:function(){
        errorDisplay( host );
      }
      ,icon: gURLRoot + '/images/iface/error.png'
      ,text:'Show Errors'
      */
    }]  
  });
  return menu
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
    ,sortInfo: { field: "Type" , direction: "ASC" }
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
    ,icon: gURLRoot + '/images/iface/resetButton.gif'
    ,text: 'Restart'
    ,tooltip: 'Click to restart selected service(s), agent(s) or mind(s)'
  },{
    cls: 'x-btn-text-icon'
    ,icon: gURLRoot + '/images/iface/submit.gif'
    ,text: 'Start'
    ,tooltip: 'Click to start selected service(s), agent(s) or mind(s)'
  },{
    cls: 'x-btn-text-icon'
    ,icon: gURLRoot + '/images/iface/stop.gif'
    ,text: 'Stop'
    ,tooltip: 'Click to stop selected service(s), agent(s) or mind(s)'
  }];
  for( var i = 0 ; i < tbar.length ; i++ ){
    tbar[ i ] = new Ext.Toolbar.Button( tbar[ i ] );
    tbar[ i ].on( 'click' , function( btn ){
      var records = grid.getSelectionModel().getSelections();
      var act = new action( records );
      Ext.apply( act , { finnaly: function(){ grid.getStore().load() } } );
      act.doCmpAction( btn.text );
    });
  }
  var view = new Ext.grid.GroupingView({
    groupTextTpl: '{[values.rs.length]} {[values.rs.length > 1 ?' +
                  ' "Records" : "Record"]} ({text})'
    ,hideGroupedColumn: true
  })
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

function action( record ){
  this.record = record;
  this.title = undefined;
  this.msg = undefined;
  this.action = undefined;
  this.params = new Object();
  this.url = 'action';
  this.postfix = 'component';
  this.finnaly = function(){
    return new Ext.emptyFn
  }
  this.check = function(){
//    if( ! Ext.isArray( this.record ){
//      showError( 'Argument record is not an array' );
//      return false;
//    }
    if( ! this.record.length > 0 ){
      showError( 'No records has been selected' );
      return false;
    }
    return true;
  }
  this.prepare = function(){
    this.title = this.action;
    this.msg = this.msg + ' ' + this.action;
    if( this.record.length > 1 ){
      this.title = this.title + ' ' + this.postfix + 's';
    }else{
      this.title = this.title + ' ' + this.postfix;
    }
    this.msg = 'Do you want to ' + this.title + ':'
    this.title = this.title.charAt( 0 ).toUpperCase() + this.title.slice( 1 );
  }
  this.showMsg = function(){
    this.msg = this.msg.slice( 0 , -2 );
    this.msg = this.msg + '?';
    return Ext.Msg.confirm( this.title , this.msg , function( btn ){
      if( btn == 'yes' ){
        ajax({
          end: this.scope.finnaly
          ,mask: true
          ,params: this.scope.params
          ,success: success
          ,url: this.scope.url
        }) ;
      }
    } , { scope: this });
  }
  this.doHostAction = function( action ){
    if( ! this.check() ){
      return false;
    }
    this.action = action.toLowerCase();
    this.postfix = 'DIRAC components on host';
    this.url = this.action + 'Host';
    this.prepare();
    var hosts = new Array();
    for( var i = 0 ; i < this.record.length ; i++){
      var host = this.record[ i ].get( 'Host' );
      hosts.push( host );
      this.msg = this.msg + ' ' + host + ', ';
    }
    this.params[ 'hostname' ] = hosts.join( ',' );
    this.showMsg();
  }  
  this.doCmpAction = function( action ){
    if( ! this.check() ){
      return false;
    }
    this.action = action.toLowerCase();
    this.params.action = this.action;
    this.prepare();
    for( var i = 0 ; i < this.record.length ; i++){
      var rec = this.record[ i ];
      var target = rec.get( 'Name' ) + ' @ ' + rec.get( 'Host' );
      if( ! this.params[ target ] ){
        this.params[ target ] = new Array();
      }
      this.msg = this.msg + ' ' + target + ', ';
      this.params[ target ].push( rec.get( 'System' ) );
    }
    this.showMsg();
  }
}

function getMenu( record , grid ){
  var act = new action( [ record ] );
  Ext.apply( act , { finnaly: function(){ grid.getStore().load() } } );
  var menu = new Ext.menu.Menu({
    items:[{
      handler:function(){
        act.doCmpAction( 'restart' );
      }
      ,icon: gURLRoot + '/images/iface/resetButton.gif'
      ,text:'Restart'
    },{
      handler: function(){
        act.doCmpAction( 'stop' );
      }
      ,icon: gURLRoot + '/images/iface/ban.gif'
      ,text: 'Stop'
    },{
      handler: function(){
        act.doCmpAction( 'start' );
      }
      ,icon: gURLRoot + '/images/iface/submit.gif'
      ,text: 'Start'
    }]  
  });
  var status = record.get( 'RunitStatus' ) ;
  if( status == 'Run' ){
    menu.items.items[ 2 ].disable();
  }else if( status == 'Down' ){
    menu.items.items[ 1 ].disable();
  }
  return menu
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

function afterDataLoad(){}
