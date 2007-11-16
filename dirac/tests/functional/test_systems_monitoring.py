from dirac.tests import *

class TestMonitoringController(TestController):

    def test_index(self):
        response = self.app.get(url_for(controller='systems/monitoring'))
        # Test response...
