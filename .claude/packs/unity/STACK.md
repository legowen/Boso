### Game — Unity (pack: unity)
- Engine: Unity (version in `ProjectSettings/ProjectVersion.txt`), C#, URP unless the project says otherwise.
- Specialist: **unity-specialist**. Path rules: `.claude/rules/unity.*.md`.
- Code under `Assets/Scripts` with assembly definitions; tests in `Assets/Tests` (EditMode for logic, PlayMode for scenes).
- Data: ScriptableObjects under `Assets/Data` (or JSON in `StreamingAssets` when it must load outside the editor).
- Batch tests: set the environment variable `UNITY_EDITOR` to the editor executable, then `checks.test` can be
  `"$UNITY_EDITOR" -batchmode -nographics -projectPath . -runTests -testPlatform EditMode -testResults .claude/state/checks/editmode.xml -logFile -`
- Version control: Force Text serialization, Visible Meta Files, `.meta` files committed with their assets, Git LFS for large binaries, UnityYAMLMerge for scenes/prefabs.
- Never edit `.unity`/`.prefab`/`.asset` YAML by hand beyond trivial value changes; prefer editor scripts.
