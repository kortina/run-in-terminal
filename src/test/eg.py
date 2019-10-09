import unittest


class Eg(unittest.TestCase):
    """Example python tests for run-in-terminal"""

    def test_one(self):
        assert "line 8" == "line 8"

    def test_two(self):
        assert "line 11" == "line 11"


if __name__ == "__main__":
    unittest.main()
