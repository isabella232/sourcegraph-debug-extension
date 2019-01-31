import * as sourcegraph from 'sourcegraph';

async function fetchSourcegraphVersion(): Promise<string> {
  const query = `query SourcegraphVersion {
    site {
        productVersion
    }
}
`;
  return sourcegraph.commands
    .executeCommand<{
      data: { site: { productVersion: string } };
      errors: any[];
    }>('queryGraphQL', query)
    .then(({ data, errors }) => {
      if (!data) {
        return 'Error with the Sourcegraph API: ' + JSON.stringify(errors);
      }

      return data.site.productVersion;
    });
}

export function activate(
  ctx: sourcegraph.ExtensionContext = {
    subscriptions: { add: (_unsubscribable: any) => void 0 }
  }
): void {
  async function setDecorations(
    pos: sourcegraph.Position,
    version: string
  ): Promise<void> {
    const editor = sourcegraph.app.activeWindow
      ? sourcegraph.app.activeWindow.visibleViewComponents[0]
      : undefined;

    if (editor) {
      editor.setDecorations(null, [
        {
          range: new sourcegraph.Range(pos, pos),
          after: {
            contentText: version,
            hoverMessage: version,
            color: 'blue'
          }
        }
      ]);
    }
  }

  ctx.subscriptions.add(
    sourcegraph.languages.registerHoverProvider(['*'], {
      provideHover: (doc, pos) =>
        fetchSourcegraphVersion()
          .then(version => {
            const value = `Sourcegraph version: ${version}`;

            return setDecorations(pos, value).then(() =>
              Promise.resolve(version)
            );
          })
          .then(version => ({ contents: { value: version } }))
    })
  );

  ctx.subscriptions.add(
    sourcegraph.commands.registerCommand('debugext.throwError', () => {
      throw new Error('Debug extension error');
    })
  );
}
