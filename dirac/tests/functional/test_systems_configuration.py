from dirac.tests import *

class TestConfigurationController(TestController):

    def test_index(self):
        response = self.app.get(url_for(controller='systems/configuration'))
        # Test response...
