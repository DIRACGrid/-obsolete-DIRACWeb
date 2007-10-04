from dirac.tests import *

class TestUserdataController(TestController):

    def test_index(self):
        response = self.app.get(url_for(controller='web/userdata'))
        # Test response...
