"""Regression tests for shared-reference distribution; no third-party packages."""

from pathlib import Path
import runpy
import shutil
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("sync_references.py")
sync_references = runpy.run_path(str(SCRIPT))["sync_references"]


class SyncReferencesTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory(prefix="shared-references-")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.plugin = self.root / "plugins" / "sample"
        self.skill = self.plugin / "skills" / "sample-task"
        self.skill.mkdir(parents=True)
        self.source = self.plugin / "reference.md"
        self.destination = self.skill / "reference.md"
        self.source.write_bytes(b"# Shared rules\r\n")
        (self.skill / "SKILL.md").write_text("Instructions\n", encoding="utf-8")

    def test_legacy_link_becomes_copy_without_changing_source_and_is_repeatable(self):
        self.destination.symlink_to("../../reference.md")
        self.assertEqual(len(sync_references(self.root)), 1)
        self.assertFalse(self.destination.is_symlink())
        self.assertEqual(self.source.read_bytes(), b"# Shared rules\r\n")
        self.assertTrue(self.destination.read_bytes().endswith(self.source.read_bytes()))
        self.assertIn(b"Do not edit this copy", self.destination.read_bytes())
        self.assertEqual(sync_references(self.root), [])
        self.assertEqual(sync_references(self.root, check=True), [])

    def test_check_detects_missing_edited_and_stale_copies_without_writing(self):
        self.assertEqual(len(sync_references(self.root, check=True)), 1)
        self.assertFalse(self.destination.exists())
        sync_references(self.root)
        self.destination.write_bytes(b"Local edit\n")
        self.assertEqual(len(sync_references(self.root, check=True)), 1)
        self.assertEqual(self.destination.read_bytes(), b"Local edit\n")
        sync_references(self.root)
        self.source.write_bytes(b"# Updated rules\n")
        self.assertEqual(len(sync_references(self.root, check=True)), 1)
        self.assertNotIn(b"Updated rules", self.destination.read_bytes())
        sync_references(self.root)
        self.assertIn(b"Updated rules", self.destination.read_bytes())

    def test_unrelated_link_aborts_before_any_copies_are_written(self):
        unrelated = self.root / "unrelated.md"
        unrelated.write_bytes(b"Keep me\n")
        self.destination.symlink_to(unrelated)
        another = self.plugin / "skills" / "another-task"
        another.mkdir()
        (another / "SKILL.md").write_bytes(b"Instructions\n")
        with self.assertRaisesRegex(ValueError, "unrelated symlink"):
            sync_references(self.root)
        self.assertEqual(unrelated.read_bytes(), b"Keep me\n")
        self.assertFalse((another / "reference.md").exists())

    def test_cli_status_and_execution_outside_repository(self):
        scripts = self.root / "scripts"
        scripts.mkdir()
        script = scripts / SCRIPT.name
        shutil.copyfile(SCRIPT, script)

        def run(*args):
            return subprocess.run(
                [sys.executable, str(script), *args],
                cwd=tempfile.gettempdir(), capture_output=True, text=True,
            )

        result = run("--check")
        self.assertEqual(result.returncode, 1)
        self.assertIn("Run make sync-references", result.stderr)
        self.assertEqual(run().returncode, 0)
        self.assertEqual(run("--check").returncode, 0)
        self.assertNotEqual(run("--unknown").returncode, 0)

    def test_plugins_without_shared_references_and_non_skill_entries_are_ignored(self):
        self.source.unlink()
        self.assertEqual(sync_references(self.root), [])
        self.source.write_bytes(b"# Rules\n")
        (self.skill.parent / "README.md").write_bytes(b"Not a skill\n")
        unrelated = self.skill.parent / "notes"
        unrelated.mkdir()
        self.assertEqual(len(sync_references(self.root)), 1)
        self.assertFalse((unrelated / "reference.md").exists())


if __name__ == "__main__":
    unittest.main()
