Ext.onReady(function(){
  Ext.Ajax.request({
    failure: function(){
      gPageDescription.userData[ 'email' ] = false;
    }
    ,method: 'POST'
    ,params: { get: 'email' , user: gPageDescription.userData[ 'username' ] }
    ,success: function( response ){
      var json = Ext.util.JSON.decode( response.responseText );
      if( json.success != 'true' ){
        return gPageDescription.userData[ 'email' ] = false;
      }
      return gPageDescription.userData[ 'email' ] = json.result;
    }
    ,timeout: 60000
    ,url: 'action'
  });
});
function sendMail(){
  return sendMessage( true );
}
function sendMessage( mail ){
  var ud = gPageDescription.userData;
  var title = 'From: ' + ud[ 'username' ] + '@' + ud[ 'group' ];
  if( mail ){
    if( Ext.isEmpty( ud.email ) ){
      return showError( 'Can not get e-mail for user: ' + ud[ 'username' ] );
    }
    title = 'From: ' + ud[ 'email' ];
  }
  var subject = new Ext.form.Field({
    allowBlank: false
    ,fieldLabel: 'Subject'
    ,name: 'subject'
  });
  var userStore = new Ext.data.JsonStore({
    autoLoad: true
    ,baseParams: { 'get' : 'user' }
    ,fields: [{ name : 'user' }]
    ,root: 'result'
    ,url: 'action'
  });
  var user = new dropdownMenu({
    combo: true
    ,displayField: 'user'
    ,emptyText: 'Select user(s)'
    ,fieldLabel: 'Send to user(s)'
    ,name:  'user'
    ,store: userStore
    ,valueField: 'user'
  });
  var groupStore = new Ext.data.JsonStore({
    autoLoad: true
    ,baseParams: { 'get' : 'group' }
    ,fields: [{ name : 'group' }]
    ,root: 'result'
    ,url: 'action'
  });
  var group = new dropdownMenu({
    combo: true
    ,displayField: 'group'
    ,emptyText: 'Select group(s)'
    ,fieldLabel: 'Send to group(s)'
    ,name:  'group'
    ,store: groupStore
    ,valueField: 'group'
  });
  var msg = new Ext.form.TextArea({
    fieldLabel: 'Message'
    ,name: 'msg'
  })
  var panel = new Ext.FormPanel({
    autoScroll: true
    ,baseParams: { 'send' : true , 'email' : mail }
    ,bodyStyle: 'padding: 5px'
    ,border: false
    ,defaultType: 'textfield'
    ,defaults: {
      anchor: '-18'
    }
    ,items: [
      user
      ,group
      ,subject
      ,msg
    ]
    ,labelWidth: 100
    ,monitorResize: true
    ,url: 'action'
  });
  panel.on({
    resize: function( panel , adjW , adjH , rawW , rawH ){
      if( ! msg.isVisible() ){
        return
      }
      var y = msg.getPosition()[ 1 ];
      var h = msg.getSize()[ 'height' ];
      if( adjH > ( y + h ) ){
        msg.setHeight( adjH - y + 20 );
      }
    }
  });
  panel.getForm().on({
    actioncomplete: function( form , action ){
      if( ! Ext.isEmpty( action.result.error )){
        showError( action.result.error );
      }
      if( ! Ext.isEmpty( action.result.result )){
        var title = 'Send message result';
        if( mail ){
          var title = 'Send mail result';
        }
        Ext.Msg.show({
          buttons: Ext.MessageBox.OK
          ,icon: Ext.MessageBox.INFO
          ,msg: action.result.result
          ,title: title
          ,width: 300
        });
      }
      return win.close()
    }
    ,actionfailed: function( form , action ){
      if( ! Ext.isEmpty( action.response.statusText )){
        showError( action.response.statusText );
      }else{
        showError( 'Unable to get status from faulty server response' );
      }
      return win.close();
    }
  })

  var win = formWindow({
    icon: 'Send'
    ,title: title
  });
  win.add( panel );

  var submit = win.buttons[ 0 ];
  if( mail ){
    submit.setText( 'Send an e-mail' );
  }else{
    submit.setText( 'Send a message' );
  }
  submit.setIconClass( 'Send' );
  submit.on({
    click: function(){ panel.getForm().submit() }
  });

  var reset = win.buttons[ 1 ] ;
  reset.on({
    click: function(){ panel.getForm().reset() }
  }) ;

  win.show();
  return win
}
