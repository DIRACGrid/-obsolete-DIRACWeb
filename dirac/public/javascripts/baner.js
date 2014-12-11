(function() {

  Ext.onReady(function() {
        if (document.baner) {

          var html = '<!DOCTYPE html> <html> <body> <p><font color="blue">Dear ' + gPageDescription.userData.username + ',<br>' + 'This portal will be not used any more. We have a new portal which is available: </font></p> <p><font color="read"> <a href="' + document.baner
              + '" style="color:red" >' + document.baner + '</a> </font></p></body> </html>'
          win = new Ext.Window({
                border : true,
                collapsible : true,
                constrain : true,
                constrainHeader : false,
                closable : true,
                height : 130,
                border : true,
                style : {
                  borderColor : 'red',
                  borderStyle : 'solid'
                },
                layout : 'fit',
                maximizable : false,
                minHeight : 400,
                minWidth : 600,
                modal : false,
                plain : false,
                shim : false,
                width : 400,
                title : "New web portal is available!!!!",
                html : html
              });
          win.show();
        }

      });
})();