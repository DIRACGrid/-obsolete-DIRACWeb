var dataSelect , datagrid ;
function init(reponseSelect){
  dataSelect = reponseSelect;
  Ext.onReady(function(){
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
  var tbar = [{
    cls: 'x-btn-text-icon'
    ,icon: gURLRoot + '/images/iface/ban.gif'
    ,text: 'Ban'
    ,tooltip: 'Click to ban selected sites(s)'
  },{
    cls: 'x-btn-text-icon'
    ,icon: gURLRoot + '/images/iface/unban.gif'
    ,text: 'Allow'
    ,tooltip: 'Click to allow selected site(s)'
  }];
  for( var i = 0 ; i < tbar.length ; i++ ){
    tbar[ i ] = new Ext.Toolbar.Button( tbar[ i ] );
    tbar[ i ].on( 'click' , function( btn ){
      var records = grid.getSelectionModel().getSelections();
      var sites = new Array();
      for( var i = 0 ; i < records.length ; i++ ){
        var status = records[ i ].get( 'MaskStatus' );
        if( btn.text == 'Ban' && status == 'Active' ){
          sites.push( records[ i ].get( 'Site' ) );
        }else if( btn.text == 'Allow' && status == 'Banned' ){
          sites.push( records[ i ].get( 'Site' ) );
        }
      }
      if( ! sites.length > 0 ){
        return showError( 'Please, select properly the sites to perform action on it' );
      }
      var act = new popup( sites );
      Ext.apply( act , {
        action: btn.text.toLowerCase()
        ,finnaly: function(){ grid.getStore().load() }
      });
      act.showMsg();
    });
  }
  var view = new Ext.grid.GroupingView({
    groupTextTpl: '<tpl if="datagrid.getStore().groupField==\'FullCountry\'">{group}:</tpl><tpl if="datagrid.getStore().groupField!=\'FullCountry\'">{text},</tpl> {[values.rs.length]} {[values.rs.length > 1 ? "Sites" : "Site"]}',
  })
  store.setDefaultSort('FullCountry','ASC'); // Default sorting
  var grid = new getDatagrid({
    autorefresh: true
    ,disableIPP: true
    ,columns: columns
    ,menu: getMenu
    ,sm: sm
    ,store: store
    ,tbar: tbar
    ,view: view
  });
  return grid
}

function getMenu( record , grid ){
  var site = record.get( 'Site' );
  var mask = record.get( 'MaskStatus' );
  var act = new popup( [ site ] );
  Ext.apply( act , { finnaly: function(){ grid.getStore().load() } } );
  var menu = new Ext.menu.Menu({
    items:[{
      handler:function(){ jump( site ) }
      ,icon: gURLRoot + '/images/iface/go.gif'
      ,text:'Show Job(s)'
    },{
      handler: function(){
        Ext.apply( act , { action: 'ban' } );
        act.showMsg();
      }
      ,icon: gURLRoot + '/images/iface/ban.gif'
      ,text: 'Ban Site'
    },{
      handler: function(){
        Ext.apply( act , { action: 'allow' } );
        act.showMsg();
      }
      ,icon: gURLRoot + '/images/iface/unban.gif'
      ,text: 'Allow Site'
    }]
  });
  if( mask == 'Active' ){
    menu.items.items[ 2 ].disable();
  }else{
    menu.items.items[ 1 ].disable();
  }
  return menu
}

function popup( sitename ){
  this.site = sitename;
  this.action = undefined;
  this.finnaly = function(){
    return new Ext.emptyFn
  }
  this.showMsg = function(){
    var title = this.action.charAt( 0 ).toUpperCase() + this.action.slice( 1 );
    var msg = 'Do you want to ' + this.action ;
    if( this.site.length > 1 ){
      title = title + ' sites';
      msg = msg + ' the sites: ' + this.site.join( ', ' ) + ' ?';
    }else{
      title = title + ' site';
      msg = msg + ' the site: ' + this.site + ' ?';
    }
    msg = msg + '<br><br>' + 'Comment:';
    Ext.Msg.prompt( title , msg ,
      function( btn , text ){
        if( btn == 'ok' ){
          ajax({
            end: this.finnaly
            ,mask: true
            ,params: {
              comment: text
              ,name: this.site
            }
            ,success: success
            ,url: this.action + 'Site'
          });
        }
      } , this , 50 ,
      this.action + ' by ' + gPageDescription.userData.username
        + '@' + gPageDescription.userData.group
    );
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

function jump( id ){
  var url = document.location.protocol + '//' + document.location.hostname
              + gURLRoot + '/' + gPageDescription.selectedSetup + '/' 
              + gPageDescription.userData.group + '/jobs/JobMonitor/display';
  var post_req = '<form id="redirform" action="' + url + '" method="POST" >'
                   + '<input type="hidden" name="site" value="' + id + '">'
                   + '</form>';
  document.body.innerHTML = document.body.innerHTML + post_req;
  var form = document.getElementById('redirform');
  form.submit();
}
function afterDataLoad(){};
