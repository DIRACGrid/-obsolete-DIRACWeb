WFTree = function( htmlid ) {

		// AZ: is there better way for this?
		this.unHilight = function ( new_node ){
			if (this.selectedNode) {
				this.selectedNode.getLabelEl().style.backgroundColor = "";
				this.selectedNode.getLabelEl().style.color = "";
			}
			this.selectedNode = new_node?new_node:null;
		}

		this.hilight = function (node){
			this.unHilight(node);
			if(!node)
				return;
			node.getLabelEl().style.backgroundColor="blue";
			node.getLabelEl().style.color="white";
		}		

		this.isValidPathPrefix = function ( prefix ) {
			if(prefix == 'production' || prefix == 'public' || prefix == 'my')
				return true;
			return false;
		}

		this.defaultPathPrefix = function ( item ) {
			if(item.AuthorGroup == 'lhcb_prod')
				return 'production';
			if(item.AuthorDN == DN)
				return 'my';
			return 'public';
		}

		this.pathForWF = function ( item ) {
			//window.alert(item.toSource())
			var path = item.WFParent;
			var splited_path = path.split('/');
			if(!splited_path.length || !this.isValidPathPrefix(splited_path[0])){
				path = this.defaultPathPrefix(item)+'/'+path;
				splited_path = path.split('/');
			}
			var path='';
			for(var i=0;i<splited_path.length;++i)
				if(splited_path[i])
					path += (splited_path[i])+'/'; // replace "///" with "/"
			return path + item.WFName;
		}

		this.makeSubTree = function( parentNode, node ) {
			var mynode;
			if( node.label ) {
				if( node.item )
					mynode = new YAHOO.widget.TextNode({ label:node.label, href:'#', item:node.item },parentNode,true);
				else
					mynode = new YAHOO.widget.TextNode({ label:node.label, href:'#' }, parentNode ,true);
			} else
				mynode = parentNode;
			for(var i=0;i<node.list.length;++i)
				this.makeSubTree(mynode, node.list[i]);
		}

		this.reGenerate = function( list ) {
			this.unHilight();
			this.tree.removeChildren(this.tree.getRoot());
			
			var wftree = { list:[{ label:'production', list:[] }, { label:'public', list:[] }, { label:'my', list:[] }] };
			for(var i=0;i<list.length;++i){
			  var path = this.pathForWF ( list[i] );
			  var spath = path.split('/');
			  var node = wftree;
			  for(var j=0;j<spath.length;++j){
			  	var k=0;
			  	for(;k<node.list.length;++k)
			  		if(node.list[k].label == spath[j])
			  			break;
			  	if(k==node.list.length)
			  		node.list.push({ label: spath[j], list:[] })
			  	node = node.list[k];
			  }
			  node.item = list[i];
			}
			this.makeSubTree(this.tree.getRoot(),wftree);

			this.tree.draw();
		}

		this.selectedNode = null;
		this.tree = new YAHOO.widget.TreeView( htmlid );
		this.tree.draw();
}
