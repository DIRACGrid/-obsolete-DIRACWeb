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
      margins:'2 0 2 0'
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
        mask: true
        ,params: params
        ,success: function( response ){
          actionSuccess( response , grid );
        }
      }) ;
    }
  });
  return
}
function actionSuccess( response , grid ){
  Ext.getBody().unmask() ;
  if( Ext.isEmpty( response ) ){
    return showError( 'Argument response in actionSuccess function is missing' );
  }
  var msg = Ext.util.JSON.decode( response.responseText ) ;
  if( Ext.isEmpty( msg ) ){
    return showError( 'Server response is null or empty' );
  }
  if( ! Ext.isEmpty( msg.error ) ){
    return showError( msg.error );
  }
  if( ! Ext.isEmpty( msg.result ) ){
    var msg = new Ext.Tip({
      baseCls:'success',
      floating: true
      ,html: msg.result
      ,width: 300
    });
    var x = Ext.num( Ext.getBody().getViewSize().width , 640 );
    x = ( ( x / 2 ) - ( msg.width / 2 ) );
    msg.showAt( [ x , 5 ] );
    setTimeout( function(){ msg.destroy() } , 3000 );
    return grid.getStore().load() ;
  }
  return showError( 'Server response have no success nor error messages' );
}
function afterDataLoad(){};

