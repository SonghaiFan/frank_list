import { AppHeader } from '@/components/AppHeader';
import { AppFooter } from '@/components/AppFooter';
import { AppMainContent } from '@/components/AppMainContent';
import { AppOverlays } from '@/components/AppOverlays';
import { useAppViewModel } from '@/hooks/useAppViewModel';
import { motion } from 'motion/react';

export default function App() {
  const vm = useAppViewModel();

  return (
    <div
      className={`min-h-screen p-4 md:p-10 flex flex-col items-center transition-colors ${
        vm.isWorkspaceFlow ? 'cursor-zoom-out' : ''
      }`}
      onClick={() => {
        if (vm.flow === 'workspace') vm.onTogglePrimaryView();
      }}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-[1240px]">
        <div className="w-full" onClick={(e) => e.stopPropagation()}>
          <AppHeader
            copySuccess={vm.copySuccess}
            flow={vm.flow}
            onBack={vm.backToEdit}
            onCopy={vm.copyToClipboard}
            onReset={vm.onResetRequest}
            onShowQrCode={vm.onShowQrCode}
            onTogglePrimaryView={vm.onTogglePrimaryView}
          />
        </div>

        <AppMainContent
          activeGroup={vm.activeGroup}
          comparison={vm.comparison}
          flow={vm.flow}
          galleryGroups={vm.galleryGroups}
          isCompareResultFlow={vm.isCompareResultFlow}
          isWorkspaceFlow={vm.isWorkspaceFlow}
          lowerStackPages={vm.lowerStackPages}
          newItemText={vm.newItemText}
          onAddItem={vm.addItem}
          onAppendPage={vm.appendEmptyPage}
          onBindPage={vm.movePageToLowerStack}
          onCreateGroup={vm.createGroup}
          onItemTextChange={vm.onItemTextChange}
          onOpenGroupFromGallery={vm.onOpenGroupFromGallery}
          onRemoveItem={vm.removeItem}
          onToggleTick={vm.toggleTick}
          stackPages={vm.stackPages}
          ticks={vm.ticks}
        />

        <AppFooter
          compareLabel={vm.labels.compareThisGroup}
          isCompareReviewFlow={vm.isCompareReviewFlow}
          isEditingFlow={vm.isEditingFlow}
          legendExternal={vm.labels.legendExternal}
          legendSelf={vm.labels.legendSelf}
          onStartComparison={vm.onStartComparison}
          signature={vm.labels.signature}
        />

        <AppOverlays
          closeLabel={vm.labels.cancel}
          closeOverlay={vm.closeOverlay}
          deleteBody={vm.labels.deleteBody}
          deleteConfirm={vm.labels.deleteConfirm}
          deleteTitle={vm.labels.deleteTitle}
          generateShareUrl={vm.generateShareUrl}
          onDeleteGroup={vm.deleteActiveGroup}
          onReset={vm.resetAll}
          overlay={vm.overlay}
          qrHint={vm.labels.qrHint}
          resetBody={vm.labels.resetBody}
          resetConfirm={vm.labels.resetConfirm}
          resetTitle={vm.labels.resetTitle}
        />
      </motion.div>
    </div>
  );
}
