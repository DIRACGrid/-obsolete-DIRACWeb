from dirac.tests import *

class TestFrameworkController(TestController):

    def test_index(self):
        response = self.app.get(url_for(controller='systems/framework'))
        # Test response...
