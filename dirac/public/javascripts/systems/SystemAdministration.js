var datagrid ;
function init( init ){
  Ext.onReady(function(){
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
      ,autoScroll : true
      ,enableTabScroll : true
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
    ,{ name: 'DIRAC' }
    ,{ name: 'Load1' }
    ,{ name: 'Load5' }
    ,{ name: 'Load15' }
    ,{ name: 'Memory' }
    ,{ name: 'Disk' }
    ,{ name: 'Swap' }
    ,{ name: 'CPUClock' }
    ,{ name: 'CPUModel' }
    ,{ name: 'CertificateDN' }
    ,{ name: 'CertificateIssuer' }
    ,{ name: 'CertificateValidity' }
    ,{ name: 'Cores' }
    ,{ name: 'PhysicalCores' }
    ,{ name: 'OpenFiles' }
    ,{ name: 'OpenPipes' }
    ,{ name: 'OpenSockets' }
    ,{ name: 'Setup' }
    ,{ name: 'Uptime' }
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
    ,dataIndex: 'DIRAC'
    ,header: 'Version'
    ,renderer: releaseNotes
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
  },{
    align: 'left'
    ,dataIndex: 'CPUClock'
    ,header: 'CPUClock'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'CPUModel'
    ,header: 'CPUModel'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'CertificateDN'
    ,header: 'CertificateDN'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'CertificateIssuer'
    ,header: 'CertificateIssuer'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'CertificateValidity'
    ,header: 'CertificateValidity'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Cores'
    ,header: 'Cores'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'PhysicalCores'
    ,header: 'PhysicalCores'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'OpenFiles'
    ,header: 'OpenFiles'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'OpenPipes'
    ,header: 'OpenPipes'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'OpenSockets'
    ,header: 'OpenSockets'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Setup'
    ,header: 'Setup'
    ,sortable: true
  },{
    align: 'left'
    ,dataIndex: 'Uptime'
    ,header: 'Uptime'
    ,sortable: true
  }];
  var tbar = [{
    cls: 'x-btn-text-icon'
    ,icon: gURLRoot + '/images/iface/lightning.png'
    ,text: 'Restart'
    ,tooltip: 'Restart all DIRAC components except Web server'
/*
  },{
    cls: 'x-btn-text-icon'
    ,icon: gURLRoot + '/images/iface/package.png'
    ,text: 'Update'
    ,tooltip: 'Click to update DIRAC software'
*/
  },{
    cls: 'x-btn-text-icon'
    ,icon: gURLRoot + '/images/iface/undo.png'
    ,text: 'Revert'
    ,tooltip: 'Replace link <DIRACROOT>/pro by <DIRACROOT>/old'
  }];
  for( var i = 0 ; i < tbar.length ; i++ ){
    tbar[ i ] = new Ext.Toolbar.Button( tbar[ i ] );
    tbar[ i ].on( 'click' , function( btn ){
      var act = new action( grid.getSelectionModel().getSelections() );
      act.doHostAction( btn.text );
    });
  }
  var grid = new getDatagrid({
    autorefresh: true
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
      ,icon: gURLRoot + '/images/iface/lightning.png'
      ,text:'Restart'
/*
    },{
      handler:function(){
        updateHost( record );
      }
      ,icon: gURLRoot + '/images/iface/package.png'
      ,text:'Update'
*/
    },{
      handler:function(){
        act.doHostAction( 'revert' );
      }
      ,icon: gURLRoot + '/images/iface/undo.png'
      ,text:'Revert'
    },{
      handler:function(){
        logError( record );
      }
      ,icon: gURLRoot + '/images/iface/error.png'
      ,text:'Show Errors'
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
  } , '-' , {
    cls: 'x-btn-text-icon'
    ,icon: gURLRoot + '/images/iface/close.gif'
    ,text: 'Uninstall'
    ,tooltip: 'Alternatively, use "uninstall <System> <Component>" in dirac-admin-sysadmin-cli utility'
  }];
  for( var i = 0 ; i < tbar.length ; i++ ){
    if( tbar[ i ] == '-' ){
      continue;
    }
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
    autorefresh: true
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
        });
      }
    } , { scope: this });
  }
  this.showPrompt = function(){
    return Ext.Msg.prompt( this.title , 'Version to install' , function( btn , text ){
      if (btn == 'ok'){
        this.scope.params[ 'version' ] = text;
        ajax({
          end: this.scope.finnaly
          ,mask: true
          ,params: this.scope.params
          ,success: success
          ,url: this.scope.url
        });
      }
    } , { scope: this } );
  }
  this.doHostAction = function( action ){
    if( ! this.check() ){
      return false;
    }
    this.postfix = 'host';
    this.action = action.toLowerCase();
    this.url = this.action + 'Host';
    this.prepare();
    var hosts = new Array();
    for( var i = 0 ; i < this.record.length ; i++){
      var host = this.record[ i ].get( 'Host' );
      hosts.push( host );
      this.msg = this.msg + ' ' + host + ', ';
    }
    this.params[ 'hostname' ] = hosts.join( ',' );
    if( action != 'update' ){
      this.showMsg();
    }else{
      this.showPrompt();
    }
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

function errorMenu( record ){
  var menu = new Ext.menu.Menu({
    items:[{
      handler: function(){
        logCmp( record );
      }
      ,icon: gURLRoot + '/images/iface/log.png'
      ,text: 'Log'
    }]
  });
  return menu
}

function getMenu( record , grid ){
  var act = new action( [ record ] );
  Ext.apply( act , { finnaly: function(){ grid.getStore().load() } } );
  var menu = new Ext.menu.Menu({
    items:[{
      handler:function(){
        logCmp( record );
      }
      ,icon: gURLRoot + '/images/iface/jdl.gif'
      ,text:'Log'
    },{
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
    } , '-' , {
      handler: function(){
        act.doCmpAction( 'uninstall' );
      }
      ,icon: gURLRoot + '/images/iface/close.gif'
      ,text: 'Uninstall'
    }]
  });
  var status = record.get( 'RunitStatus' ) ;
  if( status == 'Run' ){
    menu.items.items[ 3 ].disable();
  }else if( status == 'Down' ){
    menu.items.items[ 2 ].disable();
  }
  return menu
}

function logError( record ){
  var host = record.get( 'Host' );
  var item = new getDatagrid({
    autorefresh: true
    ,disableIPP: true
    ,columns: [{
      align: 'left' , dataIndex: 'System' , header: 'System' , sortable: true , width: 150 , fixed: true
    },{
      align: 'left' , dataIndex: 'Name' , header: 'Component' , sortable: true , width: 150 , fixed: true
    },{
      align: 'left' , dataIndex: 'ErrorsDay' , header: 'Errors per day' , sortable: true , width: 100 , fixed: true
    },{
      align: 'left' , dataIndex: 'ErrorsHour' , header: 'Errors per hour' , sortable: true , width: 100 , fixed: true
    },{
      align: 'left' , dataIndex: 'LastError' , header: 'Last Error' , sortable: true
    }]
    ,region: undefined
    ,menu: errorMenu
    ,split: undefined
    ,store: new Ext.data.JsonStore({
      autoLoad: true
      ,baseParams: {  host: host }
      ,fields: [ 'Host' , 'System' , 'Name' , 'ErrorsDay' , 'ErrorsHour' , 'LastError' ]
      ,idProperty: 'err'
      ,root: 'result'
      ,sortInfo: { field: 'ErrorsHour' , direction: 'DESC' }
      ,timeout: 360000
      ,totalProperty: 'total'
      ,url: 'showHostErrors'
    })
    ,view: new Ext.grid.GridView({ autoFill: true , forceFit: true })
  });
  var getLog = new logs();
  Ext.apply( getLog , {
    icon: 'ErrorLog'
    ,item: item
    ,title: 'Show errors for ' + host
  });
  getLog.show();
}

function logCmp( record ){
  var host = record.get( 'Host' );
  var system = record.get( 'System' );
  var cmp = record.get( 'Name' );
  var getLog = new logs();
  var item = new Ext.Panel({
    autoLoad: {
          params: {
            component: cmp
            ,host: host
            ,system: system
          }
          ,nocache: true
          ,timeout: 60
          ,url: 'showLog'
        }
    ,autoScroll: true
    ,bbar:[ {
      cls: 'x-btn-text-icon'
      ,handler: function(){
        item.load({
          params: {
            component: cmp
            ,host: host
            ,system: system
          }
          ,nocache: true
          ,timeout: 60
          ,url: 'showLog'
        })
      }
      ,iconCls: 'Refresh'
      ,text: 'Refresh'
      ,tooltip: 'Click button for manual refresh'
      ,scope: item
    } , '->' ]
    ,bodyStyle: 'padding: 5px'
    ,border: false
  })
  Ext.apply( getLog , {
    item: item
    ,title: 'Log file for ' + cmp + '/' + system + '@' + host
  });
  getLog.show();
}

function logs(){
  this.title = 'Untitled';
  this.x = 10;
  this.y = 10;
  this.width = 640;
  this.height = 480;
  this.item = undefined;
  this.icon = 'Log';
  this.calculate = function(){
    var tmpW = Ext.num( Ext.getBody().getViewSize().width , 640 ) ;
    var x = Ext.num( Ext.EventObject.xy[ 0 ] , 0 ) ;
    this.width = ( 2 * tmpW ) / 3 ;
    if( tmpW - this.width < x ){
      this.x = tmpW - this.width - 10 ;
    }
    this.x = x - 8 ;
    var tmpH = Ext.num( Ext.getBody().getViewSize().height , 480 ) ;
    var y = Ext.num( Ext.EventObject.xy[ 1 ] , 0 ) ;
    this.height = ( 2 * tmpH ) / 3
    if( tmpH - this.height < y ){
      this.y = tmpH - this.height - 10 ;
    }
    this.y = y - 8 ;
  }
  this.show = function(){
    this.calculate();
    return new Ext.Window({
      collapsible: false
      ,closable: true
      ,constrain: true
      ,constrainHeader: true
      ,height: this.height
      ,iconCls: this.icon
      ,items: this.item
      ,layout: 'fit'
      ,maximizable: true
      ,minHeight: 200
      ,minWidth: 300
      ,plain: false
      ,shim: false
      ,title: this.title
      ,width: this.width
      ,x: this.x
      ,y: this.y
    }).show();
  }
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

function releaseNotes( value ){
  var url = 'http://raw.github.com/DIRACGrid/DIRAC/' + value + '/release.notes';
  return '<a href="' + url + '" target="_blank">' + value + '</a>';
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

function afterDataLoad(){}
