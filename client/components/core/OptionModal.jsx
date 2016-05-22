import React from 'react';

class OptionModal extends React.Component {
  render() {
    return (
      <div className="modal fade" id="optionModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 className="modal-title">Options</h4>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label for="langRadio">Langue</label>
                <input type="radio" name="langRadio" value="french"/>Français
                <input type="radio" name="langRadio" value="english"/>Anglais
              </div>
              <div className="form-group">
                <label for="soundRadio">Son</label>
                <input type="radio" name="langRadio" value="enabled"/>Activé
                <input type="radio" name="langRadio" value="disabled"/>Désactivé
              </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal">Fermer</button>
            </div>
          </div>
        </div>
      </div>
      </div>
    );
  }
}

export default OptionModal;


