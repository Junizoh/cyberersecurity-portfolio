import unittest

from scripts.password_strength_checker import evaluate_password


class PasswordStrengthCheckerTests(unittest.TestCase):
    def test_weak_password(self):
        result = evaluate_password('password')
        self.assertLess(result['score'], 2)
        self.assertTrue(result['label'] in ('Very weak', 'Weak'))

    def test_strong_password(self):
        result = evaluate_password('T!mely-Redwood-92#Cabin')
        self.assertGreaterEqual(result['score'], 3)
        self.assertTrue(result['label'] in ('Strong', 'Very strong'))

    def test_does_not_store_password(self):
        password = 'Example$Password!94'
        result = evaluate_password(password)
        self.assertIsInstance(result['length'], int)
        self.assertEqual(result['length'], len(password))


if __name__ == '__main__':
    unittest.main()
