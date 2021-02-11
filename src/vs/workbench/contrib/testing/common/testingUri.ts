/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vs/base/common/uri';

export const TEST_DATA_SCHEME = 'vscode-test-data';

export const enum TestUriType {
	ResultMessage,
	ResultActualOutput,
	ResultExpectedOutput,
}

interface IResultTestUri {
	resultId: string;
	testId: string;
}

interface IResultTestMessageReference extends IResultTestUri {
	type: TestUriType.ResultMessage;
	messageIndex: number;
}

interface IResultTestOutputReference extends IResultTestUri {
	type: TestUriType.ResultActualOutput | TestUriType.ResultExpectedOutput;
	messageIndex: number;
}

export type ParsedTestUri =
	| IResultTestMessageReference
	| IResultTestOutputReference;

const enum TestUriParts {
	Results = 'results',

	Messages = 'message',
	Text = 'text',
	ActualOutput = 'actualOutput',
	ExpectedOutput = 'expectedOutput',
}

export const parseTestUri = (uri: URI): ParsedTestUri | undefined => {
	const type = uri.authority;
	const [locationId, testId, ...request] = uri.path.slice(1).split('/');

	if (request[0] === TestUriParts.Messages) {
		const index = Number(request[1]);
		const part = request[2];
		if (type === TestUriParts.Results) {
			switch (part) {
				case TestUriParts.Text:
					return { resultId: locationId, testId, messageIndex: index, type: TestUriType.ResultMessage };
				case TestUriParts.ActualOutput:
					return { resultId: locationId, testId, messageIndex: index, type: TestUriType.ResultActualOutput };
				case TestUriParts.ExpectedOutput:
					return { resultId: locationId, testId, messageIndex: index, type: TestUriType.ResultExpectedOutput };
			}
		}
	}

	return undefined;
};

export const buildTestUri = (parsed: ParsedTestUri): URI => {
	const uriParts = {
		scheme: TEST_DATA_SCHEME,
		authority: TestUriParts.Results
	};
	const msgRef = (locationId: string, index: number, ...remaining: string[]) =>
		URI.from({
			...uriParts,
			path: ['', locationId, parsed.testId, TestUriParts.Messages, index, ...remaining].join('/'),
		});

	switch (parsed.type) {
		case TestUriType.ResultActualOutput:
			return msgRef(parsed.resultId, parsed.messageIndex, TestUriParts.ActualOutput);
		case TestUriType.ResultExpectedOutput:
			return msgRef(parsed.resultId, parsed.messageIndex, TestUriParts.ExpectedOutput);
		case TestUriType.ResultMessage:
			return msgRef(parsed.resultId, parsed.messageIndex, TestUriParts.Text);
		default:
			throw new Error('Invalid test uri');
	}
};
