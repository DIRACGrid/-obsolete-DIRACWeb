from dirac.tests import *

class TestControlController(TestController):

    def test_index(self):
        response = self.app.get(url_for(controller='web/control'))
        # Test response...
