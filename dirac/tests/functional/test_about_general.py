from dirac.tests import *

class TestGeneralController(TestController):

    def test_index(self):
        response = self.app.get(url_for(controller='about/general'))
        # Test response...
