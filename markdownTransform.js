const repeat = require('lodash/repeat');

function transformByRegex(
  markdownString,
  regex,
  transformFunction
) {
  let transformedMarkdown = '';
  let currentMatch;
  let previousIndex = 0;
  while ((currentMatch = regex.exec(markdownString))) {
    transformedMarkdown += markdownString.substring(
      previousIndex,
      currentMatch.index
    );
    transformedMarkdown += transformFunction(currentMatch);
    previousIndex = currentMatch.index + currentMatch[0].length;
  }

  return transformedMarkdown + markdownString.substring(previousIndex);
}

function transformLinks(markdownString) {
  return transformByRegex(
    markdownString,
    /\[([^\]]+)]\(([^)]+)\)/gim,
    (currentMatch) => `[${currentMatch[1]}|${currentMatch[2]}]`
  );
}

function transformLists(markdownString) {
  return transformByRegex(
    markdownString,
    /\n([ ]*)([*\-+]|[0-9]+.)/gim,
    (currentMatch) => {
      const level = currentMatch[1].length / 2;
      const listType = /[*\-+]/i.test(currentMatch[2]) ? '*' : '#';
      return `\n${repeat(listType, level + 1)}`;
    }
  );
}

function transformFormatting(markdownString) {
  const strikethrough = transformByRegex(markdownString, /~~/gim, () => '-');
  const emphasis = transformByRegex(
    strikethrough,
    /(^|[^*\n])\*([^*\n]+)\*([^*]|$)/gim,
    (currentMatch) => `${currentMatch[1]}_${currentMatch[2]}_${currentMatch[3]}`
  );
  const firstBoldFix = transformByRegex(
    emphasis,
    /(^|[^*])\*\*([^*]|$)/gim,
    (currentMatch) => `${currentMatch[1]}*${currentMatch[2]}`
  );
  return transformByRegex(
    firstBoldFix,
    // this intentionally ignores a single case of __*two*__ which will loose emphasis
    /(^|[^_])_{2,3}([^_]|$)/gim,
    (currentMatch) => `${currentMatch[1]}*${currentMatch[2]}`
  );
}

function transformHeaders(markdownString) {
  return transformByRegex(
    markdownString,
    /(^|\n)+[\W]*([#]+)\W*/gim,
    (currentMatch) => {
      const headerSize = currentMatch[0].replace(/[^#]+/g, '').length;
      return `${currentMatch[1]}h${headerSize}. `;
    }
  );
}

function transformInlineCode(markdownString) {
  return transformByRegex(
    markdownString,
    /(^|[^`])`([^`]+)`([^`]|$)/gi,
    (currentMatch) =>
      `${currentMatch[1]}{{${currentMatch[2]}}}${currentMatch[3]}`
  );
}

function transformMultilineCode(markdownString) {
  return transformByRegex(
    markdownString,
    /```([\S\s]+?)```/gim,
    (currentMatch) => `{code}${currentMatch[1]}{code}`
  );
}

module.exports = function markdownTransform(markdownString) {
  try {
    return [
      transformHeaders,
      transformLinks,
      transformFormatting,
      transformLists,
      transformInlineCode,
      transformMultilineCode
    ].reduce((markdown, func) => func(markdown), markdownString);
  } catch (error) {
    return markdownString;
  }
};
