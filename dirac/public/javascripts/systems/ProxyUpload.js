function proxyUpload(){
  var fileUpload = new Ext.ux.form.FileUploadField({
    buttonOffset: 2
    ,cls: 'x-btn-text-icon'
    ,fieldLabel: 'Certificate'
    ,icon: gURLRoot + '/images/iface/addfile.gif'
  }) ;
  fileUpload.on( 'fileselected' , function( fb , name ){
    if( name.substr( -4 ) != '.p12' ){
      showError('You have to choose the *.p12 file with you credentials') ;
      return
    }else{
      submit.enable() ;
    }
  }) ;
  var pass = new Ext.form.Field({
    allowBlank:false
    ,fieldLabel:'p12 password'
    ,inputType:'password'
    ,name:'pass_p12'
  }) ;
  var disclaimer = new Ext.form.Label({
    html:'We are not keeping neither your private key nor password for'+
      ' p12 file on our service. While we try to make this process as secure'+
      ' as possible by using SSL to encrypt the p12 file with your credentials'+
      ' when it is sent to the server, for maximum security, we recommend that'+
      ' you manually convert and upload the proxy using DIRAC client commands:'+
      '<ul class="ul_disk">'+
      '<li>dirac-cert-convert.sh YOUR_P12_FILE_NAME.p12</li>'+
      '<li>dirac-proxy-init -U -g GROUP_NAME</li>'+
      '</ul><br><br>'
  }) ;
  disclaimer.on( 'render' , function(){
    var id = this.id ;
    var el = Ext.get( id ) ;
    var tmpH = Ext.num( el.getHeight() , 0 ) ;
    var xxx ;
    var frameHeight = win.getFrameHeight() ;
    var panelHeight = panel.getInnerHeight() ;
    var totalHeigth = panelHeight + frameHeight ;
    win.minHeight = totalHeigth - 5 ; 
    win.setHeight( totalHeigth ) ;
    var yy = win.getInnerHeight() ;
    var ggg ;
  }) ;
  var url = '../../info/general/proxyUpload' ;
  if( ! gPageDescription || ! gPageDescription.userData ){
    showError( 'Global object gPageDescription or userData is missing' );
  }
  if( gPageDescription.pagePath == '' ){
    url = document.location.protocol + '//' + document.location.host ;
    url = url +  gURLRoot + '/' + gPageDescription.selectedSetup + '/' ;
    url = url + gPageDescription.userData.group + '/info/general/proxyUpload' ;
  }
  var panel = new Ext.FormPanel({
    autoHeight: true
//    autoScaroll: true
    ,bodyStyle: 'padding: 5px'
    ,border: false
    ,defaultType: 'textfield'
    ,defaults: {
      allowBlank: false
      ,anchor: '-5'
    }
    ,fileUpload: true
    ,items: [
      fileUpload
      ,pass
      ,disclaimer
    ]
    ,labelWidth: 90
    ,monitorResize: true
    ,url: url
  });
  panel.on( 'resize' , function(){
    var yy = win.getInnerHeight() ;
    panel.setHeight( yy + 10 ) ;
    var zzz ;
  }) ;
  var win = displayWindow({
    icon: 'Load'
    ,title: 'Proxy upload'
  }) ;
  win.add( panel ) ;
  var submit = win.buttons[ 0 ] ;
  submit.setText( 'Upload' ) ;
  submit.setIconClass( 'Upload' ) ;
  submit.disable() ;
/*
    handler:function(){
      gMainLayout.container.mask('Sending data');
      panel.form.submit({success:sucHandler,failure:falHandler});
    },
*/

  function sucHandler(form, action){
    gMainLayout.container.unmask();
    var response = action.result
    if(response.success){
      if(response.success == 'false'){
        if(response.error){
          showError(response.error);
        }else{
          showError('Your request is failed with no error returned.');
        }
      }else if(response.success == 'true'){
        alert(response.result);
        winClose();
      }
    }else{
      showError('Server response is unknown. Most likely your request is accepted');
    }
  }
  
  submit.setHandler( function(){
    gMainLayout.container.mask( 'Uploading proxy' ) ;
    panel.form.submit( {
      success:sucHandler
    } ) ;
  } ) ;
  win.show() ;
  return
}
