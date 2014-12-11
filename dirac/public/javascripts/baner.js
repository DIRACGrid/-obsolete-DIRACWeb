(function() {

  Ext.onReady(function() {
        if (document.baner) {

          win = new Ext.Window({
                border : true,
                collapsible : true,
                constrain : true,
                constrainHeader : false,
                closable : true,
                height : 100,
                layout : 'fit',
                maximizable : false,
                minHeight : 400,
                minWidth : 600,
                modal : false,
                plain : false,
                shim : false,
                width : 400,
                title: "New web portal is available!!!!",
                html : '<!DOCTYPE html> <html> <body> <p><font color="blue">Dear user, This portal will be not used any more. We have a new portal which is available:</font></p></body> </html>"'
              });
        win.show();
        }

      });
})();