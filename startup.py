import os
import os.path
from paste.deploy import loadapp
here = os.path.dirname( os.path.realpath( __file__ ) )
app = loadapp( "config:%s/production.ini" % here )

