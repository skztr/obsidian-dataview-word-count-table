# Word Count Table

a script using the [DataView](https://github.com/blacksmithgu/obsidian-dataview) plugin for
[Obsidian](https://obsidian.md/) to keep track of word counts for works-in-progress, events, etc.

## Installation

1. Make sure you have the [DataView](https://github.com/blacksmithgu/obsidian-dataview) plugin.
2. Put the `view.js` file somewhere memorable. Personally I keep my views in a `_VIEW` folder in the root of my vault,
   eg: `_VIEW/dailies/view.js`

## Example Usage

The below will search the `/daily` folder (and all subfolders) for sections:

 - containing the tags `#lit` and `#lotr`
 - excluding the tags `#brainstorm`

and will create a table listing out for each found section:

 - a link to the section
 - the word count for that section
 - how far off the specified target that section was
 - running (monthly) total

the target in this example is 1667 words

```dataviewjs
dv.view("_VIEW/dailies", {
  searchPath: "daily",
  searchTags: ["lit", "lotr"],
  excludeTags: ["brainstorm"],
  dailyTarget: 1667,
});
```

### Example Output

Stories from the "daily" folder, containing the tags `#lit` and `#lotr`, but not containing the tag `#brainstorm`

| Date       | Story                        | Word Count  | Monthly Total |
| ---------- | ---------------------------- | ----------- | ------------- |
| 2024-01-01 | A Long-Expected Party        | 1992        | 1992          |
| 2024-01-02 | A Long-Expected Party        | 1500 (-167) | 3492          |
| 2024-01-03 | A Long-Expected Party        | 1750        | 5242          |
| 2024-01-04 | A Long-Expected Party        | 1670        | 6912          |
| 2024-01-05 | A Long-Expected Party        | 600 (-1067) | 7512          |
| 2024-01-06 | A Long-Expected Party        | 2120        | 9632          |
| 2024-01-07 | A Long-Expected Party        | 380 (-1287) | 10012         |
| 2024-01-07 | The Shadow of the Past       | 1440        | 11452         |
| 2024-01-08 | The Shadow of the Past       | 1803        | 13255         |
