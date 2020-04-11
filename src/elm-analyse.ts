type ElmAnalyse = {
    messages: AnalyseItem[];
};

type AnalyseItem = {
    id: number;
    status: string;
    file: string;
    type: string;
    data: AnalyseData;
};

type AnalyseData = {
    description: string;
    properties: AnalyseProperties;
};

type AnalyseProperties = {
    range: number[];
};

export { ElmAnalyse };
