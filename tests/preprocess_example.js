const { preprocessDocument } = require('../document/document');

const test_doc = {
    time_completed: '2023-01-01T00:00:00Z',
    time_approved: '',
    execution: {
        meta_data: {
            time_started: '2023-01-01T00:00:00Z',
            time_updated: '',
            time_completed: '',
        },
        results: {
            entries: [
                {
                    radiated_time: '2023-01-01T00:00:00Z',
                    verified_time: '',
                    ert: [
                        '2023-01-01T00:00:00Z',
                        '',
                        '2023-01-01T00:00:00Z'
                    ],    // dummy array data for testing
                    evr_data: [
                        {
                            ert: '2023-01-01T00:00:00Z',
                            scet: '2023-01-01T00:00:00Z',
                        },
                        {
                            ert: '',
                            scet: '',
                        },
                        {
                            sclk: 123,
                        },
                    ],
                    products: [
                        {
                            ert: '2023-01-01T00:00:00Z',
                            scet: '2023-01-01T00:00:00Z',
                        },
                        {
                            ert: '',
                            scet: '',
                        },
                        {
                            sclk: 123,
                        },
                    ],
                }
            ]
        }
    },
};

console.log(`before:\n${JSON.stringify(test_doc, null, 2)}`);

preprocessDocument(test_doc);

console.log(`after:\n${JSON.stringify(test_doc, null, 2)}`);