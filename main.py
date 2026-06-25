import sys
from PyQt6.QtWidgets import (
    QApplication,
    QMainWindow,
    QGraphicsScene,
    QGraphicsView,
    QToolBar,
    QGraphicsRectItem,
    QGraphicsItem
)


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("論理回路図作成ツール")
        self.resize(1000, 700)

        # 作図エリア
        self.scene = QGraphicsScene()
        self.view = QGraphicsView(self.scene)
        self.setCentralWidget(self.view)

        # ツールバー
        toolbar = QToolBar()
        self.addToolBar(toolbar)

        # AND追加ボタン
        and_action = toolbar.addAction("AND追加")
        and_action.triggered.connect(self.add_and_gate)

    def add_and_gate(self):
        gate = QGraphicsRectItem(0, 0, 80, 50)

        gate.setFlag(
            QGraphicsItem.GraphicsItemFlag.ItemIsMovable,
            True
        )

        self.scene.addItem(gate)


app = QApplication(sys.argv)

window = MainWindow()
window.show()

sys.exit(app.exec())