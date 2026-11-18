import unittest

from generate_post import (
    choose_topic,
    count_words,
    load_yaml,
    validate_article,
    WRITING_PATH,
)


class ArticleValidationTests(unittest.TestCase):
    def setUp(self):
        self.topic = {
            "id": "investment",
            "label": "Investment decisions",
            "url": "/topics/investment-decisions/",
            "question": "What deserves investment?",
            "description": "Priorities, alternatives, and full cost.",
            "questions": [
                "What outcome would justify the full cost?",
                "What alternatives should we compare?",
            ],
        }
        self.topics = load_yaml(WRITING_PATH)["topics"]

    def valid_article(self):
        answer = (
            "An AI proposal deserves investment only when it improves a defined "
            "customer or business outcome more than the realistic alternatives. "
            "Compare the full cost, including integration, review, training, and "
            "rework. Agree on a baseline and the evidence that would make you continue, "
            "change the approach, or stop before the pilot begins."
        )
        body = "\n\n".join([
            "A fast prototype can still be a poor investment.",
            "> " + answer,
            "## Compare the alternatives",
            "Start with the problem and compare AI with process changes and doing nothing.",
            "## Count the full cost",
            "Include operational costs, training, review, support, and rework.",
            "## Decide what evidence would change your mind",
            "A bounded test should reduce uncertainty about the outcome.",
            "This illustrative example shows how the decision could work. " +
            ("A team reviews cases and tests whether better information changes the outcome. " * 65),
            "Read [Investment decisions](/topics/investment-decisions/) and "
            "[Outcomes & evidence](/topics/outcomes-and-evidence/).",
            "If you would like to follow future articles, "
            "[read them by email](/newsletter/).",
        ])
        return {
            "title": "AI Investment Decisions Need a Clear Stop Rule",
            "subtitle": "A prototype is not a business case.",
            "share_description": "Compare the outcome, full cost, and alternatives.",
            "excerpt": "A practical way to judge an AI proposal.",
            "answer": answer,
            "tldr": " ".join(
                ["Compare AI with realistic alternatives and the full cost."] * 7
            ),
            "reading_topics": ["investment"],
            "keywords": ["AI investment decisions", "AI business case", "AI project costs"],
            "body": body,
        }

    def test_word_count(self):
        self.assertEqual(count_words("One, two and three."), 4)

    def test_current_topic_article_passes(self):
        article = self.valid_article()
        self.assertEqual(validate_article(article, self.topic, [], self.topics), [])

    def test_topic_selection_uses_current_coverage(self):
        writing = load_yaml(WRITING_PATH)
        recent_posts = [{"reading_topics": ["opportunities", "adoption"]}]
        selected = choose_topic(writing["topics"], recent_posts)
        self.assertIn(selected["id"], {"investment", "value"})

    def test_wrong_reading_topic_fails(self):
        article = self.valid_article()
        article["reading_topics"] = ["ai-decision-operations"]
        errors = validate_article(article, self.topic, [], self.topics)
        self.assertTrue(any("reading_topics" in error for error in errors))

    def test_short_answer_fails(self):
        article = self.valid_article()
        article["answer"] = "Too short."
        errors = validate_article(article, self.topic, [], self.topics)
        self.assertTrue(any("40-60 words" in error for error in errors))

    def test_missing_internal_links_fail(self):
        article = self.valid_article()
        article["body"] = article["body"].replace(
            "[Investment decisions](/topics/investment-decisions/)",
            "Investment decisions",
        ).replace(
            "[Outcomes & evidence](/topics/outcomes-and-evidence/)",
            "Outcomes & evidence",
        )
        errors = validate_article(article, self.topic, [], self.topics)
        self.assertTrue(any("internal Markdown" in error for error in errors))

    def test_unlabelled_hypothetical_example_fails(self):
        article = self.valid_article()
        article["body"] = article["body"].replace(
            "This illustrative example shows how the decision could work.",
            "For example, a real team achieved a major improvement.",
        )
        errors = validate_article(article, self.topic, [], self.topics)
        self.assertTrue(any("illustrative" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
