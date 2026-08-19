import React, { useState } from 'react';
import ProjectionMapCanvas from '../../components/projection/ProjectionMapCanvas';
import ConstructAgreementPanel from '../../components/projection/ConstructAgreementPanel';
import ProjectionInspectorPanel from '../../components/projection/ProjectionInspectorPanel';

const DEFAULT_REGION = {
  id: 'amber-vale',
  name: 'Amber Vale',
  nation: 'Ashen Run',
  gdp: '113,663',
  military: '2,847',
  reserves: '6,410',
  stability: '0.58',
};

export function ProjectionPage() {
  const [selectedRegion, setSelectedRegion] = useState(DEFAULT_REGION);

  return (
    <div className="relative w-full h-[calc(100vh-48px)] overflow-hidden bg-[#BACAA3]">
      {/* Interactive Map Canvas Background */}
      <ProjectionMapCanvas
        selectedRegion={selectedRegion}
        onSelectRegion={(region) => setSelectedRegion(region)}
      />

      {/* Floating Side Panels Overlay when a region is selected */}
      {selectedRegion && (
        <div className="absolute inset-0 pointer-events-none z-20 flex justify-between p-4 sm:p-6 overflow-hidden">
          {/* Left Side: Construct Agreement Panel */}
          <div className="pointer-events-auto self-start">
            <ConstructAgreementPanel
              region={selectedRegion}
              onClose={() => setSelectedRegion(null)}
            />
          </div>

          {/* Right Side: Region Dossier Inspector Panel */}
          <div className="pointer-events-auto self-start">
            <ProjectionInspectorPanel
              region={selectedRegion}
              onClose={() => setSelectedRegion(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectionPage;
