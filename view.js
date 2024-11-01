const tagRegExpG = /#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]+/gu;
const tagRegExp = /#[^\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,.:;<=>?@^`{|}~\[\]\\\s]+/u;

function getTags(content) {
    const tags = [...(content.matchAll(tagRegExpG))].map((arr) => arr[0].substr(1));
    return new Set(tags);
}

function stripComments(content) {
  return content.replace(/%%.*?%%/g, '').replace(/<!--.*?-->/g, '');
}

function getWordCount(content) {
  return content.split(/\s+/).filter((candidate) => {
    // exclude empty
    if (!candidate.length) { return false; }
    // exclude tags
    if (tagRegExp.test(candidate)) { return false; }
    // exclude "words" which do not contain any latin letters
    if (/^[^a-zA-Z]+$/.test(candidate)){ return false; }
    return true;
  }).length;
}

async function getSectionOffsets(path) {
    const content = await dv.io.load(path);
    const file = app.vault.getAbstractFileByPath(path);
    const metadata = app.metadataCache.getFileCache(file);

    // section: {label: string, start: number, end: number, tags: Set<string>, content: string};
    const sections = [];
    let next = undefined;
    for (let heading of metadata.headings||[]) {
        if (!next || heading.level === 1) {
            if (next) {
                next.end = heading.position.start.offset;
                next.content = stripComments(content.substr(next.start, next.end));
                next.tags = getTags(next.content);
                next.wordCount = getWordCount(next.content);
                sections.push(next);
            }
            next = {label: heading.heading, start: heading.position.end.offset, end: undefined, tags: []};
        }
    }
    if (next) {
        next.end = metadata.sections[metadata.sections.length - 1].position.end.offset;
        next.content = stripComments(content.substr(next.start, next.end));
        next.tags = getTags(next.content);
        next.wordCount = getWordCount(next.content);
        sections.push(next);
    }
    return sections;
}
const sectionsLib = {getSectionOffsets: getSectionOffsets};

async function dailies(input) {
  const args = {...input};
  const searchPath = args.searchPath || "daily";
  const searchTags = args.searchTags || [];
  const excludeTags = args.excludeTags || [];
  const dailyTarget = args.dailyTarget || 1000;

  dv.paragraph([
    `Stories from the ${JSON.stringify(searchPath)} folder`,
    (searchTags.length > 0 || excludeTags.length > 0) ? "," : "",
    (searchTags.length > 0) ?
      [
        " ",
        `containing the tag${(searchTags.length > 1) ? "s" : ""} `,
        searchTags.map((t) => "#" + t).join(" and ")
      ].join("") :
      "",
    ((searchTags.length > 0) && (excludeTags.length > 0)) ? ", but" : "",
    excludeTags.length > 0 ?
      [
        " ",
        `not containing the tag${(excludeTags.length > 1) ? "s" : ""} `,
        excludeTags.map((t) => "#" + t).join(" and ")
      ].join("") :
      ""
  ].join(""));
  const pages = dv.
    pages([
      JSON.stringify(searchPath),
      searchTags.map((t) => "#" + t).join(" AND ")
    ].join(" AND ")).
    sort(p => p.file.path, 'asc');
  const storySections = [];
  for (let page of pages) {
    let content = await dv.io.load(page.file.path);
    let sections = await sectionsLib.getSectionOffsets(page.file.path);

    sectionLoop: for (let section of sections) {
      for (let searchTag of searchTags) {
        if (!section.tags.has(searchTag)) {
          continue sectionLoop;
        }
      }

      let foundAllExcluded = (excludeTags.length > 0);
      for (let excludeTag of excludeTags) {
        if (!section.tags.has(excludeTag)) {
          foundAllExcluded = false;
          break;
        }
      }
      if (foundAllExcluded) { continue sectionLoop; }

      section.date = page.file.name;
      section.linkMarkdown = dv.sectionLink(
        page.file.path,
        section.label,
        false,
        section.label
      );
      section.linkMarkdown.subpath = section.label;
      storySections.push(section);
    }
  }

  let tableData = [];
  let totalWordCount = 0;
  let pageCount = 0;
  let dayCount = 0;
  let dayWordCount = 0;
  let monthWordCount = 0;

  let dayDiff = 0;
  let monthDiff = 0;
  let monthTarget = 0;

  let prevDate = undefined;
  let pageDate = undefined;
  let prevMonth = undefined;
  let pageMonth = undefined;
  for (let story of storySections) {
    pageCount++;
    let pageMonthMatch = story.date.match(/^([0-9]{4}-[0-9]{2})-/);
    if (pageMonthMatch) {
      pageMonth = pageMonthMatch[1];
    }
    if (pageMonth != prevMonth) {
      monthWordCount = 0;
      monthTarget = 0;
      prevMonth = pageMonth;
    }
    if (story.date != prevDate) {
      dayCount++;
      dayWordCount = 0;
      prevDate = story.date;
      monthTarget += dailyTarget;
    }
    dayWordCount += story.wordCount;
    monthWordCount += story.wordCount;
    totalWordCount += story.wordCount;

    dayDiff = dailyTarget - dayWordCount;
    let dayDiffText = (dayDiff > 0) ? " (" + (-1 * dayDiff) + ")" : "";
    monthDiff = monthTarget - monthWordCount;
    let monthDiffText = (monthDiff > 0) ? " (" + (-1 * monthDiff) + ")" : "";
    tableData.push([
      story.date,
      story.linkMarkdown,
      `${story.wordCount}${dayDiffText}`,
      `${monthWordCount}${monthDiffText}`
    ]);
  }

  if (tableData.length > 0) {
    dv.table(["Date", "Story", "Word Count", "Monthly Total"], tableData);
    dv.paragraph(`Total Word Count: ${totalWordCount}`)
  } else {
    dv.paragraph("No stories found.");
  }
}
await dailies(input);
